import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  let sql = 'SELECT * FROM vacancies WHERE 1=1';
  const args: (string | number)[] = [];

  const isStaff = session && (session.role === 'admin' || session.role === 'principal');
  if (!isStaff) {
    sql += ' AND published = 1';
  }

  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }

  sql += ' ORDER BY id DESC';

  const vacancies = await query(sql, args);
  return json({ vacancies });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { title, type, description, deadline, published } = body;

  if (!title?.trim()) {
    throw new HttpError(400, 'Vacancy title is required.');
  }

  if (!type || (type !== 'teaching' && type !== 'non-teaching')) {
    throw new HttpError(400, 'Vacancy type must be "teaching" or "non-teaching".');
  }

  const isPub = published === false || published === 0 ? 0 : 1;

  const res = await run(
    `INSERT INTO vacancies (title, type, description, deadline, published)
     VALUES (?, ?, ?, ?, ?)`,
    [title.trim(), type, description?.trim() || null, deadline?.trim() || null, isPub]
  );

  return json({ id: Number(res.lastInsertRowid), title: title.trim(), type }, 201);
});
