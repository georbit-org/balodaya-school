import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) throw new HttpError(400, 'Invalid book ID.');

  const book = await one<{
    id: number;
    accession_no: string;
    title: string;
    author: string | null;
    category: string | null;
    copies: number;
  }>('SELECT * FROM books WHERE id = ?', [bookId]);

  if (!book) throw new HttpError(404, 'Book not found.');

  const activeLoans = await query(
    `SELECT bl.id, bl.issued_on, bl.due_on, s.full_name as student_name, u.name as staff_name
     FROM book_loans bl
     LEFT JOIN students s ON bl.student_id = s.id
     LEFT JOIN users u ON bl.staff_id = u.id
     WHERE bl.book_id = ? AND bl.returned_on IS NULL`,
    [bookId]
  );

  return json({
    ...book,
    borrowed: activeLoans.length,
    available: book.copies - activeLoans.length,
    active_loans: activeLoans,
  });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) throw new HttpError(400, 'Invalid book ID.');

  const body = await req.json().catch(() => ({}));
  const { title, author, category, copies } = body;

  const existing = await one<{ id: number }>('SELECT id FROM books WHERE id = ?', [bookId]);
  if (!existing) throw new HttpError(404, 'Book not found.');

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (title !== undefined) {
    if (!title.trim()) throw new HttpError(400, 'Title cannot be blank.');
    updates.push('title = ?');
    args.push(title.trim());
  }
  if (author !== undefined) {
    updates.push('author = ?');
    args.push(author?.trim() ?? null);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    args.push(category?.trim() ?? null);
  }
  if (copies !== undefined) {
    const num = Math.max(1, parseInt(copies, 10) || 1);
    updates.push('copies = ?');
    args.push(num);
  }

  if (updates.length > 0) {
    args.push(bookId);
    await run(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) throw new HttpError(400, 'Invalid book ID.');

  const loanCount = await one<{ count: number }>(
    'SELECT COUNT(*) as count FROM book_loans WHERE book_id = ?',
    [bookId]
  );
  if (loanCount && loanCount.count > 0) {
    throw new HttpError(400, 'Cannot delete book with existing loan records. Mark copies to 0 or archive instead.');
  }

  await run('DELETE FROM books WHERE id = ?', [bookId]);
  return json({ ok: true });
});
