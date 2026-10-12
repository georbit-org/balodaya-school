import { requireUser } from '@/server/guard';
import { query, one, batch } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { can } from '@/lib/permissions';
import { todayNPT, isWorkingDay } from '@/lib/calendar';
import { getCalendarContext, assertWorkingDay } from '@/server/services/calendar';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  if (!can(user.role, 'staff_attendance.view') && user.role !== 'teacher' && user.role !== 'accountant') {
    throw new HttpError(403, 'Permission denied.');
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayNPT();

  // Validate format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, 'Invalid date format (must be YYYY-MM-DD)');
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  const yearId = currentYear?.id ?? 1;
  const calendarCtx = await getCalendarContext(yearId, 'staff');

  const isWorkDay = isWorkingDay(date, calendarCtx);
  let offDayReason: string | null = null;
  if (!isWorkDay) {
    if (calendarCtx.holidays.has(date)) {
      const hol = await one<{ title: string; kind: string }>(
        'SELECT title, kind FROM school_calendar WHERE (date = ? OR (? BETWEEN date AND COALESCE(end_date, date))) LIMIT 1',
        [date, date]
      );
      offDayReason = hol ? `${hol.kind === 'vacation' ? 'Vacation' : 'Holiday'}: ${hol.title}` : 'Official Holiday';
    } else {
      offDayReason = 'Weekly Off Day';
    }
  }

  // Active staff members
  let staffList = await query<{
    id: number;
    name: string;
    email: string;
    role: string;
    designation: string | null;
    phone: string | null;
  }>(`
    SELECT id, name, email, role, designation, phone
    FROM users
    WHERE role IN ('teacher', 'accountant', 'principal') AND active = 1
    ORDER BY role DESC, name ASC
  `);

  if (!can(user.role, 'staff_attendance.view')) {
    // Non-admin/principal can only see themselves
    staffList = staffList.filter((s) => s.id === user.id);
  }

  // Existing attendance for the date
  const existingAttendance = await query<{
    user_id: number;
    status: string;
    check_in: string | null;
    check_out: string | null;
    note: string | null;
    marked_by_name: string | null;
  }>(`
    SELECT sa.user_id, sa.status, sa.check_in, sa.check_out, sa.note, u_m.name as marked_by_name
    FROM staff_attendance sa
    LEFT JOIN users u_m ON sa.marked_by = u_m.id
    WHERE sa.date = ?
  `, [date]);

  const attMap = new Map<number, (typeof existingAttendance)[0]>();
  for (const a of existingAttendance) {
    attMap.set(a.user_id, a);
  }

  // Approved leave requests covering this date
  const approvedLeaves = await query<{
    user_id: number;
    leave_type_name: string;
    reason: string;
  }>(`
    SELECT slr.user_id, lt.name as leave_type_name, slr.reason
    FROM staff_leave_requests slr
    JOIN leave_types lt ON slr.leave_type_id = lt.id
    WHERE slr.status = 'approved' AND ? BETWEEN slr.from_date AND slr.to_date
  `, [date]);

  const leaveMap = new Map<number, { type: string; reason: string }>();
  for (const l of approvedLeaves) {
    leaveMap.set(l.user_id, { type: l.leave_type_name, reason: l.reason });
  }

  // Merge records
  const records = staffList.map((st) => {
    const existing = attMap.get(st.id);
    const approvedLeave = leaveMap.get(st.id);

    let status = existing ? existing.status : (approvedLeave ? 'leave' : 'present');
    if (approvedLeave && !existing) {
      status = 'leave';
    }

    return {
      user_id: st.id,
      name: st.name,
      email: st.email,
      role: st.role,
      designation: st.designation || (st.role === 'principal' ? 'Principal' : st.role === 'accountant' ? 'Accountant' : 'Faculty'),
      phone: st.phone,
      status,
      check_in: existing?.check_in || null,
      check_out: existing?.check_out || null,
      note: existing?.note || (approvedLeave ? `Approved Leave: ${approvedLeave.type}` : null),
      on_approved_leave: Boolean(approvedLeave),
      leave_type: approvedLeave?.type || null,
      marked_by_name: existing?.marked_by_name || null,
    };
  });

  return json({
    date,
    isWorkingDay: isWorkDay,
    offDayReason,
    records,
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (!can(user.role, 'staff_attendance.mark')) {
    throw new HttpError(403, 'Permission denied. Only Administrator or Principal can mark staff attendance.');
  }

  const body = await req.json();
  const date = String(body.date || '').trim();
  const entries = Array.isArray(body.entries) ? body.entries : [];
  const overrideReason = body.override_reason ? String(body.override_reason).trim() : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, 'Invalid date format (must be YYYY-MM-DD)');
  }

  const today = todayNPT();
  if (date > today) {
    throw new HttpError(422, 'Cannot record staff attendance for future dates.');
  }

  if (entries.length === 0) {
    throw new HttpError(400, 'Entries list cannot be empty.');
  }

  // Verify working day unless administrative override is supplied
  if (!overrideReason) {
    await assertWorkingDay(date, 'staff');
  }

  const allowedStatuses = new Set(['present', 'absent', 'late', 'leave', 'half_day', 'on_duty']);

  const statements: Array<{ sql: string; args: any[] }> = [];

  for (const entry of entries) {
    const userId = Number(entry.user_id);
    const status = String(entry.status || 'present');
    const checkIn = entry.check_in ? String(entry.check_in).trim() : null;
    const checkOut = entry.check_out ? String(entry.check_out).trim() : null;
    const note = entry.note ? String(entry.note).trim() : null;

    if (!userId || isNaN(userId)) continue;
    if (!allowedStatuses.has(status)) {
      throw new HttpError(400, `Invalid status "${status}" for staff ID ${userId}.`);
    }

    statements.push({
      sql: `
        INSERT INTO staff_attendance (user_id, date, status, check_in, check_out, note, marked_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET
          status = excluded.status,
          check_in = excluded.check_in,
          check_out = excluded.check_out,
          note = excluded.note,
          marked_by = excluded.marked_by
      `,
      args: [userId, date, status, checkIn, checkOut, note, user.id],
    });
  }

  if (statements.length > 0) {
    await batch(statements);
  }

  // Audit log
  await batch([{
    sql: `INSERT INTO audit_log (user_id, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)`,
    args: [
      user.id,
      'STAFF_ATTENDANCE_RECORDED',
      'staff_attendance',
      0,
      `Recorded staff attendance for date ${date} (${statements.length} staff members). Override: ${overrideReason || 'none'}`
    ]
  }]);

  return json({
    success: true,
    message: `Staff attendance saved for ${statements.length} staff members.`,
    count: statements.length,
    date,
  });
});
