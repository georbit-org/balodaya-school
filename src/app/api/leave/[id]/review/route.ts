import { requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const params = await context?.params;
  const leaveId = parseInt(params?.id || '', 10);
  if (isNaN(leaveId)) throw new HttpError(400, 'Invalid leave request ID.');

  const leave = await one<{
    id: number;
    student_id: number;
    from_date: string;
    to_date: string;
    status: string;
  }>('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);

  if (!leave) throw new HttpError(404, 'Leave request not found.');

  const body = await req.json().catch(() => ({}));
  const { status, review_note = '' } = body;

  if (status !== 'approved' && status !== 'rejected') {
    throw new HttpError(400, "Status must be either 'approved' or 'rejected'.");
  }

  // Find active enrollment for the student
  const enrollment = await one<{ id: number }>(
    `SELECT e.id
     FROM enrollments e
     JOIN academic_years ay ON e.academic_year_id = ay.id
     WHERE e.student_id = ? AND ay.is_current = 1
     LIMIT 1`,
    [leave.student_id]
  );

  let affectedDays = 0;

  if (status === 'approved' && enrollment) {
    // Generate dates between from_date and to_date
    const cur = new Date(leave.from_date);
    const end = new Date(leave.to_date);

    while (cur <= end) {
      const dayOfWeek = cur.getDay(); // 0=Sunday..6=Saturday
      // School days are Sunday to Friday (dayOfWeek !== 6)
      if (dayOfWeek !== 6) {
        const dateStr = cur.toISOString().slice(0, 10);

        const existing = await one<{ id: number; status: string }>(
          'SELECT id, status FROM attendance WHERE enrollment_id = ? AND date = ?',
          [enrollment.id, dateStr]
        );

        if (!existing) {
          await run(
            `INSERT INTO attendance (enrollment_id, date, status, note, marked_by)
             VALUES (?, ?, 'leave', 'Approved leave', ?)`,
            [enrollment.id, dateStr, user.id]
          );
          affectedDays++;
        } else if (existing.status === 'absent') {
          await run(
            `UPDATE attendance SET status = 'leave', note = 'Approved leave', marked_by = ?
             WHERE id = ?`,
            [user.id, existing.id]
          );
          affectedDays++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  await run(
    `UPDATE leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), review_note = ?
     WHERE id = ?`,
    [status, user.id, review_note.trim(), leaveId]
  );

  return json({ success: true, status, affectedDays });
});
