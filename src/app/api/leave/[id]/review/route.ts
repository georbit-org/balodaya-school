import { requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { getCalendarContext } from '@/server/services/calendar';
import { getSetting } from '@/server/settings';
import { eachDay, isWorkingDay } from '@/lib/calendar';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied. Only academic staff can review student leave applications.');
  }

  const params = await context?.params;
  const leaveId = parseInt(params?.id || '', 10);
  if (isNaN(leaveId)) throw new HttpError(400, 'Invalid leave request ID.');

  const leave = await one<{
    id: number;
    student_id: number;
    from_date: string;
    to_date: string;
    working_days: number | null;
    status: string;
    requested_by: number;
  }>('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);

  if (!leave) throw new HttpError(404, 'Leave request not found.');

  if (leave.status !== 'pending') {
    throw new HttpError(409, `This leave request is already marked as ${leave.status}.`);
  }

  if (leave.requested_by === user.id) {
    throw new HttpError(403, 'You cannot review a leave request you submitted.');
  }

  // Teacher scoping check
  if (user.role === 'teacher') {
    const isClassTeacher = await one(
      `SELECT sec.id FROM sections sec
       JOIN enrollments e ON e.section_id = sec.id
       WHERE e.student_id = ? AND sec.class_teacher_id = ?`,
      [leave.student_id, user.id]
    );
    if (!isClassTeacher) {
      throw new HttpError(
        403,
        'Only the designated class teacher of this student’s section (or principal/admin) can review this leave.'
      );
    }

    // Check if leave duration exceeds class teacher threshold
    const maxDaysByTeacher = await getSetting<number>('max_student_leave_days_teacher');
    if (leave.working_days && leave.working_days > Number(maxDaysByTeacher || 3)) {
      throw new HttpError(
        403,
        `Student leave exceeds ${maxDaysByTeacher} working days. It must be reviewed by the Principal.`
      );
    }
  }

  const body = await req.json().catch(() => ({}));
  const { status, review_note = '' } = body;

  if (status !== 'approved' && status !== 'rejected') {
    throw new HttpError(400, "Status must be either 'approved' or 'rejected'.");
  }

  // Find active enrollment for the student
  const enrollment = await one<{ id: number; academic_year_id: number }>(
    `SELECT e.id, e.academic_year_id
     FROM enrollments e
     JOIN academic_years ay ON e.academic_year_id = ay.id
     WHERE e.student_id = ? AND ay.is_current = 1
     LIMIT 1`,
    [leave.student_id]
  );

  let affectedDays = 0;

  if (status === 'approved' && enrollment) {
    const calendarCtx = await getCalendarContext(enrollment.academic_year_id, 'students');
    const allDays = eachDay(leave.from_date, leave.to_date);

    for (const dateStr of allDays) {
      // ONLY mark attendance on actual working school days! Never on off days or holidays!
      if (!isWorkingDay(dateStr, calendarCtx)) {
        continue;
      }

      const existing = await one<{ id: number; status: string }>(
        'SELECT id, status FROM attendance WHERE enrollment_id = ? AND date = ?',
        [enrollment.id, dateStr]
      );

      if (!existing) {
        await run(
          `INSERT INTO attendance (enrollment_id, date, status, note, marked_by)
           VALUES (?, ?, 'leave', 'Approved student leave', ?)`,
          [enrollment.id, dateStr, user.id]
        );
        affectedDays++;
      } else if (existing.status === 'absent') {
        await run(
          `UPDATE attendance SET status = 'leave', note = 'Approved student leave', marked_by = ?
           WHERE id = ?`,
          [user.id, existing.id]
        );
        affectedDays++;
      }
    }
  }

  await run(
    `UPDATE leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), review_note = ?
     WHERE id = ?`,
    [status, user.id, review_note.trim(), leaveId]
  );

  // Log leave event
  await run(
    `INSERT INTO leave_events (request_kind, request_id, actor_id, action, note)
     VALUES ('student', ?, ?, ?, ?)`,
    [leaveId, user.id, status, review_note.trim() || `Marked as ${status}`]
  );

  return json({ success: true, status, affectedDays });
});
