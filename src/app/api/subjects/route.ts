import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const subjects = await query<{ id: number; name: string }>(
    'SELECT id, name FROM subjects ORDER BY name'
  );
  return json({ subjects });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name || typeof name !== 'string') {
    throw new HttpError(400, 'Subject name is required.');
  }

  const cleanName = name.trim();

  const existing = await one('SELECT id FROM subjects WHERE lower(name) = lower(?)', [cleanName]);
  if (existing) {
    throw new HttpError(409, 'Subject with this name already exists.');
  }

  const res = await run('INSERT INTO subjects (name) VALUES (?)', [cleanName]);
  return json({ id: Number(res.lastInsertRowid), name: cleanName }, 201);
});
