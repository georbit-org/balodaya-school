import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const studentId = parseInt(params?.id || '', 10);

  if (isNaN(studentId)) {
    throw new HttpError(400, 'Invalid student ID.');
  }

  // Authorization check
  if (user.role === 'student') {
    const own = await one('SELECT id FROM students WHERE id = ? AND user_id = ?', [studentId, user.id]);
    if (!own) throw new HttpError(403, 'Permission denied.');
  } else if (user.role === 'parent') {
    const child = await one('SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?', [
      studentId,
      user.id,
    ]);
    if (!child) throw new HttpError(403, 'Permission denied.');
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
    created_at: string;
  }>(
    `SELECT s.*, h.name as house_name
     FROM students s
     LEFT JOIN houses h ON s.house_id = h.id
     WHERE s.id = ?`,
    [studentId]
  );

  if (!student) {
    throw new HttpError(404, 'Student not found.');
  }

  // Fetch parallel child records
  const [guardians, enrollments, attendanceRows, invoices, transport] = await Promise.all([
    query('SELECT id, name, relation, phone, email, is_primary FROM student_guardians WHERE student_id = ?', [
      studentId,
    ]),
    query(
      `SELECT e.id, e.roll_no, ay.name as academic_year, c.name as class_name, sec.name as section_name
       FROM enrollments e
       JOIN academic_years ay ON e.academic_year_id = ay.id
       JOIN sections sec ON e.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       WHERE e.student_id = ?
       ORDER BY ay.name DESC`,
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
      `SELECT i.id, i.invoice_no, i.title, i.total, i.due_date,
              COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount
       FROM invoices i
       WHERE i.student_id = ?
       ORDER BY i.id DESC`,
      [studentId]
    ),
    one(
      `SELECT tr.name as route_name, tr.vehicle_no, ts.name as stop_name, ts.pickup_time
       FROM student_transport st
       JOIN transport_routes tr ON st.route_id = tr.id
       LEFT JOIN transport_stops ts ON st.stop_id = ts.id
       WHERE st.student_id = ?`,
      [studentId]
    ),
  ]);

  return json({
    student,
    guardians,
    enrollments,
    attendance: attendanceRows,
    invoices,
    transport: transport || null,
  });
});

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const staff = await requireUser();
  if (staff.role !== 'admin' && staff.role !== 'principal') {
    throw new HttpError(403, 'Permission denied.');
  }

  const params = await context?.params;
  const studentId = parseInt(params?.id || '', 10);
  if (isNaN(studentId)) throw new HttpError(400, 'Invalid student ID.');

  const body = await req.json().catch(() => ({}));
  const { full_name, dob, gender, address, house_id, status } = body;

  await run(
    `UPDATE students
     SET full_name = COALESCE(?, full_name),
         dob = COALESCE(?, dob),
         gender = COALESCE(?, gender),
         address = COALESCE(?, address),
         house_id = COALESCE(?, house_id),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [full_name, dob, gender, address, house_id, status, studentId]
  );

  return json({ success: true });
});
