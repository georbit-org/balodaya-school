import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const params = await context?.params;
  const studentId = parseInt(params?.id || '', 10);
  if (isNaN(studentId)) throw new HttpError(400, 'Invalid student ID.');

  const body = await req.json().catch(() => ({}));
  const { section_id } = body;
  if (!section_id) throw new HttpError(400, 'Section ID is required.');

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Find max roll in the target section
  const rollRow = await one<{ max_roll: number | null }>(
    'SELECT MAX(roll_no) as max_roll FROM enrollments WHERE section_id = ? AND academic_year_id = ?',
    [section_id, currentYear.id]
  );
  const nextRoll = (rollRow?.max_roll ?? 0) + 1;

  // Check if student already enrolled in current year
  const existingEnrollment = await one<{ id: number }>(
    'SELECT id FROM enrollments WHERE student_id = ? AND academic_year_id = ?',
    [studentId, currentYear.id]
  );

  if (existingEnrollment) {
    await run(
      'UPDATE enrollments SET section_id = ?, roll_no = ? WHERE id = ?',
      [section_id, nextRoll, existingEnrollment.id]
    );
  } else {
    await run(
      'INSERT INTO enrollments (student_id, academic_year_id, section_id, roll_no) VALUES (?, ?, ?, ?)',
      [studentId, currentYear.id, section_id, nextRoll]
    );
  }

  return json({ success: true, roll_no: nextRoll });
});
