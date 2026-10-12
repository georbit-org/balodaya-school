import { readSession } from '@/server/session';
import { one } from '@/server/db';
import { jsonOk, jsonUnauthorized } from '@/server/http';

export async function GET() {
  const user = await readSession();
  if (!user) {
    return jsonUnauthorized();
  }

  try {
    let applicationsCount = 0;
    let leaveCount = 0;
    let messagesCount = 0;
    let noticesCount = 0;

    if (user.role === 'admin' || user.role === 'principal') {
      const appRow = await one<{ count: number }>(
        `SELECT COUNT(*) as count FROM applications WHERE status = 'new'`
      );
      applicationsCount = appRow?.count || 0;

      const leaveRow = await one<{ count: number }>(
        `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`
      );
      const staffLeaveRow = await one<{ count: number }>(
        `SELECT COUNT(*) as count FROM staff_leave_requests WHERE status = 'pending' AND user_id != ?`,
        [user.id]
      );
      leaveCount = (leaveRow?.count || 0) + (staffLeaveRow?.count || 0);

      const msgRow = await one<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages WHERE status = 'new'`
      );
      messagesCount = msgRow?.count || 0;
    } else if (user.role === 'teacher') {
      const leaveRow = await one<{ count: number }>(
        `SELECT COUNT(*) as count FROM leave_requests lr
         JOIN students s ON lr.student_id = s.id
         JOIN enrollments e ON s.id = e.student_id
         JOIN sections sec ON e.section_id = sec.id
         WHERE lr.status = 'pending' AND sec.class_teacher_id = ?`,
        [user.id]
      );
      leaveCount = leaveRow?.count || 0;
    }

    const noticesRow = await one<{ count: number }>(
      `SELECT COUNT(*) as count FROM notices WHERE published = 1`
    );
    noticesCount = noticesRow?.count || 0;

    return jsonOk({
      applications: applicationsCount,
      leave: leaveCount,
      messages: messagesCount,
      notices: noticesCount,
    });
  } catch (error) {
    console.error('Failed to fetch shell counts:', error);
    return jsonOk({
      applications: 0,
      leave: 0,
      messages: 0,
      notices: 0,
    });
  }
}
