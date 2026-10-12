import { requireUser, requireRole } from '@/server/guard';
import { one, run, query } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { getCalendarContext } from '@/server/services/calendar';
import { eachDay, isWorkingDay } from '@/lib/calendar';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireRole('admin', 'principal');
  const params = await context?.params;
  const leaveId = parseInt(params?.id || '', 10);
  if (isNaN(leaveId)) throw new HttpError(400, 'Invalid staff leave request ID.');

  const leave = await one<{
    id: number;
    user_id: number;
    leave_type_id: number;
    from_date: string;
    to_date: string;
    half_day: number;
    working_days: number;
    status: string;
    applicant_role: string;
    applicant_name: string;
  }>(`
    SELECT slr.*, u.role as applicant_role, u.name as applicant_name
    FROM staff_leave_requests slr
    JOIN users u ON slr.user_id = u.id
    WHERE slr.id = ?
  `, [leaveId]);

  if (!leave) throw new HttpError(404, 'Staff leave request not found.');

  if (leave.status !== 'pending') {
    throw new HttpError(409, `This leave request is already marked as ${leave.status}.`);
  }

  // Hard Rule: No one approves their own leave
  if (leave.user_id === user.id) {
    throw new HttpError(403, 'Permission denied. You cannot approve your own leave application.');
  }

  // Hierarchy enforcement:
  // If applicant is Principal -> Only Admin can review
  if (leave.applicant_role === 'principal' && user.role !== 'admin') {
    throw new HttpError(403, 'Permission denied. The Principal’s leave request can only be reviewed by the Administrator.');
  }

  const body = await req.json().catch(() => ({}));
  const { status, review_note = '', substitute_user_id } = body;

  if (status !== 'approved' && status !== 'rejected' && status !== 'info_requested') {
    throw new HttpError(400, "Status must be 'approved', 'rejected', or 'info_requested'.");
  }

  let subUserId: number | null = null;
  if (substitute_user_id) {
    const sub = parseInt(substitute_user_id, 10);
    if (!isNaN(sub)) subUserId = sub;
  }

  // If approved: mark staff attendance on each working day & update leave balances
  let affectedDays = 0;
  if (status === 'approved') {
    const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
    const yearId = currentYear?.id ?? 1;

    const calendarCtx = await getCalendarContext(yearId, 'staff');
    const allDays = eachDay(leave.from_date, leave.to_date);

    for (const dateStr of allDays) {
      if (!isWorkingDay(dateStr, calendarCtx)) {
        continue;
      }

      await run(
        `INSERT INTO staff_attendance (user_id, date, status, note, marked_by)
         VALUES (?, ?, 'leave', 'Approved staff leave', ?)
         ON CONFLICT(user_id, date) DO UPDATE SET
           status = 'leave',
           note = 'Approved staff leave',
           marked_by = excluded.marked_by`,
        [leave.user_id, dateStr, user.id]
      );
      affectedDays++;
    }

    // Deduct from staff_leave_balances
    const balanceExists = await one(
      `SELECT user_id FROM staff_leave_balances
       WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?`,
      [leave.user_id, leave.leave_type_id, yearId]
    );

    if (balanceExists) {
      await run(
        `UPDATE staff_leave_balances
         SET used = used + ?
         WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?`,
        [leave.working_days, leave.user_id, leave.leave_type_id, yearId]
      );
    } else {
      const typeDef = await one<{ annual_quota: number | null }>(
        'SELECT annual_quota FROM leave_types WHERE id = ?',
        [leave.leave_type_id]
      );
      await run(
        `INSERT INTO staff_leave_balances (user_id, leave_type_id, academic_year_id, allocated, used)
         VALUES (?, ?, ?, ?, ?)`,
        [leave.user_id, leave.leave_type_id, yearId, typeDef?.annual_quota ?? 0, leave.working_days]
      );
    }
  }

  // Update staff leave request status
  await run(
    `UPDATE staff_leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'),
         review_note = ?, substitute_user_id = ?
     WHERE id = ?`,
    [status, user.id, review_note.trim(), subUserId, leaveId]
  );

  // Record into leave_events
  await run(
    `INSERT INTO leave_events (request_kind, request_id, actor_id, action, note)
     VALUES ('staff', ?, ?, ?, ?)`,
    [leaveId, user.id, status, review_note.trim() || `Marked as ${status}`]
  );

  return json({
    success: true,
    status,
    affectedDays,
  });
});
