import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  // Can be called by staff or authenticated users
  const classes = await query<{ id: number; name: string; sort_order: number }>(
    'SELECT id, name, sort_order FROM classes ORDER BY sort_order'
  );

  const sections = await query<{ id: number; class_id: number; name: string; teacher_name: string | null }>(
    `SELECT s.id, s.class_id, s.name, u.name as teacher_name
     FROM sections s
     LEFT JOIN users u ON s.class_teacher_id = u.id
     ORDER BY s.name`
  );

  const subjects = await query<{
    id: number;
    class_id: number;
    subject_id: number;
    subject_name: string;
    teacher_name: string | null;
    full_marks: number;
    pass_marks: number;
  }>(
    `SELECT cs.id, cs.class_id, cs.subject_id, sub.name as subject_name, u.name as teacher_name, cs.full_marks, cs.pass_marks
     FROM class_subjects cs
     JOIN subjects sub ON cs.subject_id = sub.id
     LEFT JOIN users u ON cs.teacher_id = u.id
     ORDER BY sub.name`
  );

  const result = classes.map((c) => ({
    ...c,
    sections: sections.filter((s) => s.class_id === c.id),
    subjects: subjects.filter((sub) => sub.class_id === c.id),
  }));

  return json({ classes: result });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { name, sort_order } = body;

  if (!name || typeof name !== 'string') {
    throw new HttpError(400, 'Class name is required.');
  }

  const existing = await one('SELECT id FROM classes WHERE name = ?', [name.trim()]);
  if (existing) {
    throw new HttpError(409, 'Class name already exists.');
  }

  const sort = sort_order ? parseInt(sort_order, 10) : 99;
  const res = await run('INSERT INTO classes (name, sort_order) VALUES (?, ?)', [
    name.trim(),
    sort,
  ]);

  return json({ id: Number(res.lastInsertRowid), name: name.trim(), sort_order: sort }, 201);
});
