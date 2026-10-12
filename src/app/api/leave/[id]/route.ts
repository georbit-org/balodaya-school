import { requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const leaveId = parseInt(params?.id || '', 10);
  if (isNaN(leaveId)) throw new HttpError(400, 'Invalid leave request ID.');

  const leave = await one<{
    id: number;
    student_id: number;
    requested_by: number;
    status: string;
  }>('SELECT id, student_id, requested_by, status FROM leave_requests WHERE id = ?', [leaveId]);

  if (!leave) throw new HttpError(404, 'Leave request not found.');

  // Check ownership
  const isCreator = leave.requested_by === user.id;
  const isStudent = user.role === 'student' && (await one('SELECT id FROM students WHERE id = ? AND user_id = ?', [leave.student_id, user.id]));
  const isParent = user.role === 'parent' && (await one('SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?', [leave.student_id, user.id]));

  if (!isCreator && !isStudent && !isParent && user.role !== 'admin' && user.role !== 'principal') {
    throw new HttpError(403, 'Permission denied. You can only cancel your own pending applications.');
  }

  if (leave.status !== 'pending') {
    throw new HttpError(400, `Cannot cancel a leave application that is already ${leave.status}.`);
  }

  await run(
    `UPDATE leave_requests SET status = 'cancelled' WHERE id = ?`,
    [leaveId]
  );

  return json({ success: true, status: 'cancelled' });
});
