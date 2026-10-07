import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

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
  const { name, class_teacher_id = null } = body;

  if (!name || typeof name !== 'string') {
    throw new HttpError(400, 'Section name is required (e.g. A, B).');
  }

  const cleanName = name.trim().toUpperCase();

  const existing = await one('SELECT id FROM sections WHERE class_id = ? AND name = ?', [
    classId,
    cleanName,
  ]);
  if (existing) {
    throw new HttpError(409, `Section ${cleanName} already exists for this class.`);
  }

  const res = await run(
    'INSERT INTO sections (class_id, name, class_teacher_id) VALUES (?, ?, ?)',
    [classId, cleanName, class_teacher_id || null]
  );

  return json(
    {
      id: Number(res.lastInsertRowid),
      class_id: classId,
      name: cleanName,
      class_teacher_id,
    },
    201
  );
});
