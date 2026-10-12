import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const user = await requireUser();
  if (user.role !== 'student') {
    throw new HttpError(403, 'This endpoint is for students only.');
  }

  const student = await one<{
    id: number;
    admission_no: string;
    user_id: number | null;
    full_name: string;
    gender: string | null;
    dob: string | null;
    blood_group: string | null;
    address: string | null;
    house_id: number | null;
    house_name: string | null;
    status: string;
    admitted_on: string | null;
    class_name: string | null;
    section_name: string | null;
    roll_no: number | null;
  }>(
    `SELECT s.*, h.name as house_name, c.name as class_name, sec.name as section_name, e.roll_no
     FROM students s
     LEFT JOIN houses h ON s.house_id = h.id
     LEFT JOIN enrollments e ON e.student_id = s.id
     LEFT JOIN sections sec ON e.section_id = sec.id
     LEFT JOIN classes c ON sec.class_id = c.id
     WHERE s.user_id = ?
     LIMIT 1`,
    [user.id]
  );

  if (!student) {
    throw new HttpError(404, 'Student profile record not found for this user.');
  }

  const studentId = student.id;

  const [guardians, transport, attendanceStats, recentResults, invoices] = await Promise.all([
    query('SELECT id, name, relation, phone, email, is_primary FROM student_guardians WHERE student_id = ?', [
      studentId,
    ]),
    one(
      `SELECT tr.name as route_name, tr.vehicle_no, ts.name as stop_name, ts.pickup_time
       FROM student_transport st
       JOIN transport_routes tr ON st.route_id = tr.id
       LEFT JOIN transport_stops ts ON st.stop_id = ts.id
       WHERE st.student_id = ?`,
      [studentId]
    ),
    query(
      `SELECT a.status, count(*) as count
       FROM attendance a
       JOIN enrollments e ON a.enrollment_id = e.id
       WHERE e.student_id = ?
       GROUP BY a.status`,
      [studentId]
    ),
    query(
      `SELECT ex.id as exam_id, ex.name as exam_name, m.marks, s.name as subject_name, cs.full_marks, cs.pass_marks
       FROM marks m
       JOIN exams ex ON m.exam_id = ex.id
       JOIN subjects s ON m.subject_id = s.id
       JOIN enrollments e ON m.enrollment_id = e.id
       JOIN sections sec ON e.section_id = sec.id
       JOIN class_subjects cs ON cs.class_id = sec.class_id AND cs.subject_id = s.id
       WHERE e.student_id = ? AND ex.status = 'published'
       ORDER BY ex.id DESC LIMIT 10`,
      [studentId]
    ),
    query(
      `SELECT i.id, i.invoice_no, i.title, i.total, i.due_date,
              COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount
       FROM invoices i
       WHERE i.student_id = ?
       ORDER BY i.id DESC LIMIT 5`,
      [studentId]
    ),
  ]);

  const invoicesWithStatus = invoices.map((inv: any) => ({
    ...inv,
    balance: Math.max(0, inv.total - inv.paid_amount),
    status: inv.paid_amount >= inv.total ? 'Paid' : inv.paid_amount > 0 ? 'Partial' : 'Unpaid',
  }));

  return json({
    student,
    guardians,
    transport: transport || null,
    attendanceStats,
    recentResults,
    invoices: invoicesWithStatus,
  });
});
