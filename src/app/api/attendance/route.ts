import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const date = url.searchParams.get('date');
  const studentId = url.searchParams.get('student_id');
  const month = url.searchParams.get('month');

  // Student / Parent viewing monthly calendar for a specific student
  if (studentId || user.role === 'student' || user.role === 'parent') {
    let targetStudentId = studentId ? parseInt(studentId, 10) : null;
    if (user.role === 'student') {
      const student = await one<{ id: number }>('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!student) throw new HttpError(404, 'Student profile not found.');
      targetStudentId = student.id;
    } else if (user.role === 'parent') {
      if (!targetStudentId) {
        const firstChild = await one<{ student_id: number }>(
          'SELECT student_id FROM student_guardians WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        if (!firstChild) throw new HttpError(404, 'No children linked.');
        targetStudentId = firstChild.student_id;
      } else {
        const allowed = await one(
          'SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?',
          [targetStudentId, user.id]
        );
        if (!allowed) throw new HttpError(403, 'Permission denied.');
      }
    }

    const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

    const records = await query<{
      date: string;
      status: string;
      note: string | null;
    }>(
      `SELECT a.date, a.status, a.note
       FROM attendance a
       JOIN enrollments e ON a.enrollment_id = e.id
       WHERE e.student_id = ? AND e.academic_year_id = ? AND a.date LIKE ?
       ORDER BY a.date ASC`,
      [targetStudentId, currentYear?.id ?? 0, `${targetMonth}%`]
    );

    return json({ studentId: targetStudentId, month: targetMonth, records });
  }

  // Teacher / Staff view of daily section roster
  if (!sectionId || !date) {
    throw new HttpError(400, 'section_id and date are required.');
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Teacher permission check
  if (user.role === 'teacher') {
    const isAssigned = await one(
      `SELECT id FROM sections WHERE id = ? AND class_teacher_id = ?
       UNION
       SELECT id FROM class_subjects WHERE section_id = ? AND teacher_id = ?`,
      [sectionId, user.id, sectionId, user.id]
    );
    if (!isAssigned) {
      throw new HttpError(403, 'You are not assigned to take attendance for this section.');
    }
  }

  const rows = await query<{
    enrollment_id: number;
    student_id: number;
    admission_no: string;
    full_name: string;
    roll_no: number | null;
    gender: string | null;
    status: 'present' | 'absent' | 'late' | 'leave' | null;
    note: string | null;
  }>(
    `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name,
            e.roll_no, s.gender, a.status, a.note
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     LEFT JOIN attendance a ON a.enrollment_id = e.id AND a.date = ?
     WHERE e.section_id = ? AND e.academic_year_id = ? AND s.status = 'active'
     ORDER BY e.roll_no ASC, s.full_name ASC`,
    [date, sectionId, currentYear.id]
  );

  return json({
    sectionId: parseInt(sectionId, 10),
    date,
    roster: rows,
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const { section_id, date, entries } = body;

  if (!section_id || !date || !Array.isArray(entries) || entries.length === 0) {
    throw new HttpError(400, 'section_id, date, and entries array are required.');
  }

  // Prevent future dates
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    throw new HttpError(400, 'Attendance cannot be marked for future dates.');
  }

  // Teacher permission check
  if (user.role === 'teacher') {
    const isAssigned = await one(
      `SELECT id FROM sections WHERE id = ? AND class_teacher_id = ?
       UNION
       SELECT id FROM class_subjects WHERE section_id = ? AND teacher_id = ?`,
      [section_id, user.id, section_id, user.id]
    );
    if (!isAssigned) {
      throw new HttpError(403, 'You are not assigned to take attendance for this section.');
    }
  }

  // Upsert all entries
  for (const entry of entries) {
    const { enrollment_id, status, note = null } = entry;
    if (!enrollment_id || !['present', 'absent', 'late', 'leave'].includes(status)) {
      continue;
    }

    await run(
      `INSERT INTO attendance (enrollment_id, date, status, note, marked_by)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(enrollment_id, date) DO UPDATE SET
         status = excluded.status,
         note = excluded.note,
         marked_by = excluded.marked_by`,
      [enrollment_id, date, status, note, user.id]
    );
  }

  return json({ success: true, count: entries.length });
});
