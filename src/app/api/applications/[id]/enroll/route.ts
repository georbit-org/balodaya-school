import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const staff = await requireRole('admin', 'principal');
  const params = await context?.params;
  const appId = parseInt(params?.id || '', 10);

  if (isNaN(appId)) {
    throw new HttpError(400, 'Invalid application ID.');
  }

  const app = await one<{
    id: number;
    reference: string;
    student_name: string;
    dob: string | null;
    gender: 'male' | 'female' | 'other' | null;
    class_applying: string;
    guardian_name: string;
    guardian_phone: string;
    guardian_email: string | null;
    address: string | null;
    status: string;
    student_id: number | null;
  }>('SELECT * FROM applications WHERE id = ?', [appId]);

  if (!app) {
    throw new HttpError(404, 'Application not found.');
  }

  // Idempotency: Enrolling the same application twice returns 409
  if (app.status === 'enrolled' || app.student_id !== null) {
    throw new HttpError(409, 'This application has already been enrolled into a student record.');
  }

  const body = await req.json().catch(() => ({}));
  const { section_id, house_id = null } = body;

  if (!section_id) {
    throw new HttpError(400, 'Please select a section to enroll the student into.');
  }

  const section = await one<{ id: number; class_id: number }>(
    'SELECT id, class_id FROM sections WHERE id = ?',
    [section_id]
  );
  if (!section) {
    throw new HttpError(404, 'Selected class section does not exist.');
  }

  // Current academic year
  const currentYear = await one<{ id: number; name: string }>(
    'SELECT id, name FROM academic_years WHERE is_current = 1'
  );
  if (!currentYear) {
    throw new HttpError(500, 'No active academic year configured in system.');
  }

  // 1. Generate admission number: BAL-<year>-<4-digit sequence>
  const studentCount = await one<{ count: number }>(
    'SELECT count(*) as count FROM students WHERE admission_no LIKE ?',
    [`BAL-${currentYear.name}-%`]
  );
  const nextSeq = (studentCount ? studentCount.count : 0) + 1;
  const admissionNo = `BAL-${currentYear.name}-${String(nextSeq).padStart(4, '0')}`;

  // 2. Create student record
  const studentRes = await run(
    `INSERT INTO students (admission_no, full_name, gender, dob, address, house_id, status, admitted_on)
     VALUES (?, ?, ?, ?, ?, ?, 'active', date('now'))`,
    [admissionNo, app.student_name, app.gender, app.dob, app.address, house_id || null]
  );
  const newStudentId = Number(studentRes.lastInsertRowid);

  // 3. Create primary guardian
  await run(
    `INSERT INTO student_guardians (student_id, name, relation, phone, email, is_primary)
     VALUES (?, ?, 'Guardian', ?, ?, 1)`,
    [newStudentId, app.guardian_name, app.guardian_phone, app.guardian_email]
  );

  // 4. Determine next roll_no in this section for the active year
  const rollRow = await one<{ max_roll: number | null }>(
    'SELECT MAX(roll_no) as max_roll FROM enrollments WHERE section_id = ? AND academic_year_id = ?',
    [section_id, currentYear.id]
  );
  const rollNo = (rollRow?.max_roll ?? 0) + 1;

  // 5. Create enrollment
  await run(
    `INSERT INTO enrollments (student_id, academic_year_id, section_id, roll_no)
     VALUES (?, ?, ?, ?)`,
    [newStudentId, currentYear.id, section_id, rollNo]
  );

  // 6. Link application and mark enrolled
  await run(
    "UPDATE applications SET student_id = ?, status = 'enrolled' WHERE id = ?",
    [newStudentId, appId]
  );

  // 7. Audit log
  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'enroll_student', 'students', ?, ?)`,
    [staff.id, newStudentId, `Enrolled application ${app.reference} as student ${admissionNo} (Roll ${rollNo})`]
  );

  return json(
    {
      studentId: newStudentId,
      admissionNo,
      rollNo,
      message: 'Student enrolled successfully.',
    },
    201
  );
});
