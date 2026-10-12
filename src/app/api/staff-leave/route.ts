import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { ensureDefaultLeaveTypes } from '@/server/services/leave';
import { getCalendarContext } from '@/server/services/calendar';
import { workingDaysBetween } from '@/lib/calendar';

export const GET = handle(async () => {
  const user = await requireUser();
  if (user.role !== 'teacher' && user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'admin') {
    throw new HttpError(403, 'Permission denied.');
  }

  await ensureDefaultLeaveTypes();

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  const yearId = currentYear?.id ?? 1;

  // Available staff leave types
  const leaveTypes = await query(`
    SELECT * FROM leave_types
    WHERE audience IN ('staff', 'both')
    ORDER BY id ASC
  `);

  // Own balances
  const balances = await query(`
    SELECT lt.id as leave_type_id, lt.code, lt.name, lt.annual_quota,
           COALESCE(slb.allocated, lt.annual_quota, 0) as allocated,
           COALESCE(slb.used, 0) as used
    FROM leave_types lt
    LEFT JOIN staff_leave_balances slb
      ON slb.leave_type_id = lt.id AND slb.user_id = ? AND slb.academic_year_id = ?
    WHERE lt.audience IN ('staff', 'both')
  `, [user.id, yearId]);

  // Own requests
  const myRequests = await query(`
    SELECT slr.*, lt.code as leave_type_code, lt.name as leave_type_name,
           u_app.name as approver_name, u_rev.name as reviewer_name
    FROM staff_leave_requests slr
    JOIN leave_types lt ON slr.leave_type_id = lt.id
    LEFT JOIN users u_app ON slr.approver_id = u_app.id
    LEFT JOIN users u_rev ON slr.reviewed_by = u_rev.id
    WHERE slr.user_id = ?
    ORDER BY slr.id DESC
  `, [user.id]);

  // If Principal: pending teacher/accountant requests
  let pendingReviews: any[] = [];
  if (user.role === 'principal') {
    pendingReviews = await query(`
      SELECT slr.*, lt.code as leave_type_code, lt.name as leave_type_name,
             u.name as applicant_name, u.role as applicant_role, u.designation as applicant_designation
      FROM staff_leave_requests slr
      JOIN users u ON slr.user_id = u.id
      JOIN leave_types lt ON slr.leave_type_id = lt.id
      WHERE slr.status = 'pending' AND slr.user_id != ? AND u.role IN ('teacher', 'accountant')
      ORDER BY slr.id ASC
    `, [user.id]);
  } else if (user.role === 'admin') {
    // Admin reviews principal's leave requests (and any all-staff leaves)
    pendingReviews = await query(`
      SELECT slr.*, lt.code as leave_type_code, lt.name as leave_type_name,
             u.name as applicant_name, u.role as applicant_role, u.designation as applicant_designation
      FROM staff_leave_requests slr
      JOIN users u ON slr.user_id = u.id
      JOIN leave_types lt ON slr.leave_type_id = lt.id
      WHERE slr.status = 'pending' AND slr.user_id != ?
      ORDER BY slr.id ASC
    `, [user.id]);
  }

  return json({
    leaveTypes,
    balances,
    myRequests,
    pendingReviews,
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'teacher' && user.role !== 'accountant' && user.role !== 'principal') {
    throw new HttpError(403, 'Permission denied. Only staff members can submit staff leave requests.');
  }

  const body = await req.json().catch(() => ({}));
  const { leave_type_id, from_date, to_date, reason, half_day = 0, attachment_url } = body;

  const typeId = parseInt(leave_type_id, 10);
  if (isNaN(typeId) || !from_date || !to_date || !reason?.trim()) {
    throw new HttpError(400, 'Leave type, from date, to date, and reason are required.');
  }

  if (from_date > to_date) {
    throw new HttpError(400, 'From date cannot be after to date.');
  }

  // Overlap check for this user
  const overlap = await one(
    `SELECT id FROM staff_leave_requests
     WHERE user_id = ? AND status IN ('pending', 'approved')
       AND NOT (to_date < ? OR from_date > ?)`,
    [user.id, from_date, to_date]
  );
  if (overlap) {
    throw new HttpError(409, 'You already have an active leave request covering these dates.');
  }

  // Calculate working days excluding off days and holidays
  const calendarCtx = await getCalendarContext(undefined, 'staff');
  const workingDays = workingDaysBetween(from_date, to_date, calendarCtx);
  const actualDays = half_day ? 0.5 : workingDays;

  if (actualDays === 0) {
    throw new HttpError(
      422,
      'The selected date range contains only non-working days (weekly off / holidays). Staff leave cannot be submitted.'
    );
  }

  // Resolve target approver based on organizational hierarchy:
  // Teachers and Accountants -> Principal
  // Principal -> Admin
  let approverId: number | null = null;
  if (user.role === 'teacher' || user.role === 'accountant') {
    const principal = await one<{ id: number }>(
      `SELECT id FROM users WHERE role = 'principal' AND active = 1 LIMIT 1`
    );
    approverId = principal?.id ?? null;
  } else if (user.role === 'principal') {
    const admin = await one<{ id: number }>(
      `SELECT id FROM users WHERE role = 'admin' AND active = 1 LIMIT 1`
    );
    approverId = admin?.id ?? null;
  }

  const res = await run(
    `INSERT INTO staff_leave_requests
       (user_id, leave_type_id, from_date, to_date, half_day, working_days, reason, attachment_url, status, approver_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [user.id, typeId, from_date, to_date, half_day ? 1 : 0, actualDays, reason.trim(), attachment_url || null, approverId]
  );

  const newId = Number(res.lastInsertRowid);

  // Log leave event
  await run(
    `INSERT INTO leave_events (request_kind, request_id, actor_id, action, note)
     VALUES ('staff', ?, ?, 'applied', ?)`,
    [newId, user.id, `Submitted ${actualDays} days staff leave`]
  );

  return json({ id: newId, workingDays: actualDays, success: true }, 201);
});
