import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();

  // Strict role check: students and parents MUST NOT view class marks sheets
  if (user.role === 'student' || user.role === 'parent') {
    throw new HttpError(403, 'Permission denied. Students and parents cannot access class marks entry sheets.');
  }

  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const subjectId = url.searchParams.get('subject_id');

  if (!sectionId || !subjectId) {
    throw new HttpError(400, 'section_id and subject_id are required.');
  }

  const section = await one<{ class_id: number; class_teacher_id: number | null }>(
    'SELECT class_id, class_teacher_id FROM sections WHERE id = ?',
    [sectionId]
  );
  if (!section) throw new HttpError(404, 'Section not found.');

  // Get subject info & rules
  const subject = await one<{
    id: number;
    name: string;
    full_marks: number;
    pass_marks: number;
    teacher_id: number | null;
  }>(
    `SELECT s.id, s.name, cs.full_marks, cs.pass_marks, cs.teacher_id
     FROM subjects s
     JOIN class_subjects cs ON cs.subject_id = s.id
     WHERE s.id = ? AND cs.class_id = ?`,
    [subjectId, section.class_id]
  );

  if (!subject) {
    throw new HttpError(404, 'Subject assignment not found for this class.');
  }

  // Teacher scoping check
  if (user.role === 'teacher') {
    if (subject.teacher_id !== user.id && section.class_teacher_id !== user.id) {
      throw new HttpError(403, 'You are not assigned to view or enter marks for this subject/section.');
    }
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Students in section with marks
  const rows = await query<{
    enrollment_id: number;
    student_id: number;
    admission_no: string;
    full_name: string;
    roll_no: number | null;
    marks: number | null;
    is_absent: number | null;
  }>(
    `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name, e.roll_no,
            m.marks, m.is_absent
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     LEFT JOIN marks m ON m.enrollment_id = e.id AND m.exam_id = ? AND m.subject_id = ?
     WHERE e.section_id = ? AND e.academic_year_id = ? AND s.status = 'active'
     ORDER BY e.roll_no ASC, s.full_name ASC`,
    [examId, subjectId, sectionId, currentYear.id]
  );

  return json({
    examId,
    sectionId: parseInt(sectionId, 10),
    subject,
    students: rows,
  });
});

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();

  // Strict role check: Parents and students NEVER enter marks
  if (user.role === 'student' || user.role === 'parent' || user.role === 'accountant') {
    throw new HttpError(403, 'Permission denied. You cannot enter examination marks.');
  }

  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const exam = await one<{ id: number; status: string | null; published: number }>(
    'SELECT id, status, published FROM exams WHERE id = ?',
    [examId]
  );
  if (!exam) throw new HttpError(404, 'Exam not found.');

  // Teacher cannot modify locked or published marks
  if (user.role === 'teacher') {
    if (exam.status === 'locked' || exam.status === 'published' || exam.published === 1) {
      throw new HttpError(403, 'Marks entry is locked or already published for this examination. Contact the Principal.');
    }
  }

  const body = await req.json().catch(() => ({}));
  const { section_id, subject_id, marks } = body;

  if (!section_id || !subject_id || !Array.isArray(marks)) {
    throw new HttpError(400, 'section_id, subject_id, and marks array are required.');
  }

  const section = await one<{ class_id: number; class_teacher_id: number | null }>(
    'SELECT class_id, class_teacher_id FROM sections WHERE id = ?',
    [section_id]
  );
  if (!section) throw new HttpError(404, 'Section not found.');

  const subjectRule = await one<{ full_marks: number; teacher_id: number | null }>(
    'SELECT full_marks, teacher_id FROM class_subjects WHERE class_id = ? AND subject_id = ?',
    [section.class_id, subject_id]
  );
  if (!subjectRule) throw new HttpError(404, 'Subject not assigned to this class.');

  // Teacher permission check
  if (user.role === 'teacher') {
    if (subjectRule.teacher_id !== user.id && section.class_teacher_id !== user.id) {
      throw new HttpError(403, 'You are not assigned to enter marks for this subject.');
    }
  }

  const maxMarks = subjectRule.full_marks;

  for (const item of marks) {
    const { enrollment_id, marks: val, is_absent: markAbsent } = item;
    if (!enrollment_id) continue;

    let score: number | null = null;
    let isAbsent = markAbsent ? 1 : 0;

    if (val === 'AB' || val === 'ab' || markAbsent) {
      score = null;
      isAbsent = 1;
    } else if (val !== null && val !== undefined && val !== '') {
      score = Number(val);
      if (isNaN(score) || score < 0 || score > maxMarks) {
        throw new HttpError(400, `Marks must be between 0 and ${maxMarks}. Received: ${val}`);
      }
      isAbsent = 0;
    }

    await run(
      `INSERT INTO marks (exam_id, enrollment_id, subject_id, marks, is_absent, entered_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(exam_id, enrollment_id, subject_id) DO UPDATE SET
         marks = excluded.marks,
         is_absent = excluded.is_absent,
         entered_by = excluded.entered_by,
         updated_at = excluded.updated_at`,
      [examId, enrollment_id, subject_id, score, isAbsent, user.id]
    );
  }

  return json({ success: true, count: marks.length });
});
