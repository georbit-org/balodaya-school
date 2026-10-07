import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  if (!session) {
    throw new HttpError(401, 'Unauthorized');
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const category = url.searchParams.get('category')?.trim();

  let sql = `
    SELECT b.id, b.accession_no, b.title, b.author, b.category, b.copies,
           (SELECT COUNT(*) FROM book_loans bl WHERE bl.book_id = b.id AND bl.returned_on IS NULL) AS borrowed,
           (b.copies - (SELECT COUNT(*) FROM book_loans bl WHERE bl.book_id = b.id AND bl.returned_on IS NULL)) AS available
    FROM books b
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (q) {
    sql += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.accession_no LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term);
  }

  if (category) {
    sql += ' AND b.category = ?';
    args.push(category);
  }

  sql += ' ORDER BY b.title ASC';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { accession_no, title, author, category, copies } = body;

  if (!accession_no?.trim() || !title?.trim()) {
    throw new HttpError(400, 'Accession number and title are required.');
  }

  const existing = await one<{ id: number }>('SELECT id FROM books WHERE accession_no = ?', [accession_no.trim()]);
  if (existing) {
    throw new HttpError(409, `A book with accession number "${accession_no}" already exists.`);
  }

  const numCopies = Math.max(1, parseInt(copies ?? '1', 10) || 1);

  const res = await run(
    'INSERT INTO books (accession_no, title, author, category, copies) VALUES (?, ?, ?, ?, ?)',
    [accession_no.trim(), title.trim(), author?.trim() ?? null, category?.trim() ?? null, numCopies]
  );

  return json({ id: Number(res.lastInsertRowid), accession_no, title }, 201);
});
