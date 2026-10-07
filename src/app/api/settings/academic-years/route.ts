import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const years = await query('SELECT id, name, start_date, end_date, is_current FROM academic_years ORDER BY id DESC');
  return json({ years });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { name, start_date = null, end_date = null } = body;

  if (!name || typeof name !== 'string') {
    throw new HttpError(400, 'Academic year name is required (e.g. 2084).');
  }

  const existing = await one('SELECT id FROM academic_years WHERE name = ?', [name.trim()]);
  if (existing) {
    throw new HttpError(409, 'Academic year already exists.');
  }

  const res = await run(
    'INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, 0)',
    [name.trim(), start_date, end_date]
  );

  return json({ id: Number(res.lastInsertRowid), name: name.trim() }, 201);
});
