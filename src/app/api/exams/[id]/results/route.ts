import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import {
  computeStudentResults,
  GradeScaleRow,
  SubjectRule,
  StudentMarkEntry,
} from '@/server/services/results';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const studentIdParam = url.searchParams.get('student_id');

  const exam = await one<{
    id: number;
    name: string;
    published: number;
    public_results: number;
    academic_year_name: string;
  }>(
    `SELECT e.*, ay.name as academic_year_name
     FROM exams e
     JOIN academic_years ay ON e.academic_year_id = ay.id
     WHERE e.id = ?`,
    [examId]
  );
  if (!exam) throw new HttpError(404, 'Exam not found.');

  if ((user.role === 'parent' || user.role === 'student') && !exam.published) {
    throw new HttpError(403, 'Examination results have not been published yet.');
  }

  // Determine target section
  let targetSectionId = sectionId ? parseInt(sectionId, 10) : null;
  let targetStudentId = studentIdParam ? parseInt(studentIdParam, 10) : null;

  if (user.role === 'student') {
    const s = await one<{ id: number }>('SELECT id FROM students WHERE user_id = ?', [user.id]);
    if (!s) throw new HttpError(404, 'Student profile not found.');
    targetStudentId = s.id;
  } else if (user.role === 'parent') {
    if (targetStudentId) {
      const allowed = await one(
        'SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?',
        [targetStudentId, user.id]
      );
      if (!allowed) throw new HttpError(403, 'Permission denied.');
    } else {
      const firstChild = await one<{ student_id: number }>(
        'SELECT student_id FROM student_guardians WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (!firstChild) throw new HttpError(404, 'No children linked.');
      targetStudentId = firstChild.student_id;
    }
  }

  // If targetStudentId is known and no targetSectionId, find student's section
  if (targetStudentId && !targetSectionId) {
    const enroll = await one<{ section_id: number }>(
      `SELECT e.section_id
       FROM enrollments e
       JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE e.student_id = ? AND ay.is_current = 1
       LIMIT 1`,
      [targetStudentId]
    );
    if (enroll) targetSectionId = enroll.section_id;
  }

  if (!targetSectionId) {
    throw new HttpError(400, 'section_id or valid student context is required.');
  }

  // Section & Class info
  const section = await one<{
    id: number;
    name: string;
    class_id: number;
    class_name: string;
  }>(
    `SELECT sec.id, sec.name, sec.class_id, c.name as class_name
     FROM sections sec
     JOIN classes c ON sec.class_id = c.id
     WHERE sec.id = ?`,
    [targetSectionId]
  );
  if (!section) throw new HttpError(404, 'Section not found.');

  // Subjects assigned to this class
  const subjects = await query<SubjectRule>(
    `SELECT s.id, s.name, s.name as code, cs.full_marks, cs.pass_marks
     FROM class_subjects cs
     JOIN subjects s ON cs.subject_id = s.id
     WHERE cs.class_id = ?
     ORDER BY s.id ASC`,
    [section.class_id]
  );

  // Grade scale
  const gradeScale = await query<GradeScaleRow>(
    'SELECT min_percent, grade, gpa FROM grade_scale ORDER BY min_percent DESC'
  );

  // Students in section
  const students = await query<{
    enrollment_id: number;
    student_id: number;
    admission_no: string;
    student_name: string;
    roll_no: number | null;
  }>(
    `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name as student_name, e.roll_no
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     JOIN academic_years ay ON e.academic_year_id = ay.id
     WHERE e.section_id = ? AND ay.is_current = 1 AND s.status = 'active'
     ORDER BY e.roll_no ASC, s.full_name ASC`,
    [targetSectionId]
  );

  // All marks for this exam and section
  const markRows = await query<{
    enrollment_id: number;
    subject_id: number;
    marks: number | null;
  }>(
    `SELECT m.enrollment_id, m.subject_id, m.marks
     FROM marks m
     JOIN enrollments e ON m.enrollment_id = e.id
     WHERE m.exam_id = ? AND e.section_id = ?`,
    [examId, targetSectionId]
  );

  const studentMarksMap = new Map<number, StudentMarkEntry[]>();
  for (const m of markRows) {
    if (!studentMarksMap.has(m.enrollment_id)) {
      studentMarksMap.set(m.enrollment_id, []);
    }
    studentMarksMap.get(m.enrollment_id)!.push({
      subject_id: m.subject_id,
      marks: m.marks,
    });
  }

  const rawStudents = students.map((s) => ({
    ...s,
    marks: studentMarksMap.get(s.enrollment_id) || [],
  }));

  // Run calculation engine
  const computedResults = computeStudentResults(rawStudents, subjects, gradeScale);

  // If single student requested, filter or find
  if (targetStudentId) {
    const single = computedResults.find((r) => r.student_id === targetStudentId);
    return json({
      exam,
      section,
      subjects,
      gradeScale,
      result: single || null,
      results: single ? [single] : [],
    });
  }

  return json({
    exam,
    section,
    subjects,
    gradeScale,
    results: computedResults,
  });
});
