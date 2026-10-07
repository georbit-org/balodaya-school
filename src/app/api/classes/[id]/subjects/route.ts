import { requireRole, requireUser } from '@/server/guard';
import { run, one, query } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireUser();
  const params = await context?.params;
  const classId = parseInt(params?.id || '', 10);
  if (isNaN(classId)) throw new HttpError(400, 'Invalid class ID.');

  const subjects = await query<{
    id: number;
    subject_id: number;
    subject_name: string;
    teacher_id: number | null;
    teacher_name: string | null;
    full_marks: number;
    pass_marks: number;
  }>(
    `SELECT cs.id, cs.subject_id, s.name as subject_name,
            cs.teacher_id, u.name as teacher_name,
            cs.full_marks, cs.pass_marks
     FROM class_subjects cs
     JOIN subjects s ON cs.subject_id = s.id
     LEFT JOIN users u ON cs.teacher_id = u.id
     WHERE cs.class_id = ?
     ORDER BY s.id ASC`,
    [classId]
  );

  return json({ subjects });
});

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin');
  const params = await context?.params;
  const classId = parseInt(params?.id || '', 10);

  if (isNaN(classId)) {
    throw new HttpError(400, 'Invalid class ID.');
  }

  const cls = await one('SELECT id FROM classes WHERE id = ?', [classId]);
  if (!cls) {
    throw new HttpError(404, 'Class not found.');
  }

  const body = await req.json().catch(() => ({}));
  const { subject_id, teacher_id = null, full_marks = 100, pass_marks = 40 } = body;

  if (!subject_id) {
    throw new HttpError(400, 'Subject ID is required.');
  }

  const sub = await one('SELECT id FROM subjects WHERE id = ?', [subject_id]);
  if (!sub) {
    throw new HttpError(404, 'Subject not found.');
  }

  const existing = await one(
    'SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?',
    [classId, subject_id]
  );
  if (existing) {
    throw new HttpError(409, 'This subject is already assigned to this class.');
  }

  const res = await run(
    `INSERT INTO class_subjects (class_id, subject_id, teacher_id, full_marks, pass_marks)
     VALUES (?, ?, ?, ?, ?)`,
    [classId, subject_id, teacher_id || null, full_marks, pass_marks]
  );

  return json(
    {
      id: Number(res.lastInsertRowid),
      class_id: classId,
      subject_id,
      teacher_id,
      full_marks,
      pass_marks,
    },
    201
  );
});
