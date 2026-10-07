import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const session = await readSession();
  const isStaff = session && (session.role === 'admin' || session.role === 'principal');

  let sql = 'SELECT * FROM tenders WHERE 1=1';
  if (!isStaff) {
    sql += ' AND published = 1';
  }
  sql += ' ORDER BY id DESC';

  const tenders = await query(sql);
  return json({ tenders });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { title, description, file_path, deadline, published } = body;

  if (!title?.trim()) {
    throw new HttpError(400, 'Tender title is required.');
  }

  const isPub = published === false || published === 0 ? 0 : 1;

  const res = await run(
    `INSERT INTO tenders (title, description, file_path, deadline, published)
     VALUES (?, ?, ?, ?, ?)`,
    [title.trim(), description?.trim() || null, file_path?.trim() || null, deadline?.trim() || null, isPub]
  );

  return json({ id: Number(res.lastInsertRowid), title: title.trim() }, 201);
});
