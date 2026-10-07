import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal', 'teacher');
  const { id } = await ctx.params;
  const loanId = parseInt(id, 10);
  if (isNaN(loanId)) throw new HttpError(400, 'Invalid loan ID.');

  const loan = await one<{ id: number; returned_on: string | null }>(
    'SELECT id, returned_on FROM book_loans WHERE id = ?',
    [loanId]
  );
  if (!loan) throw new HttpError(404, 'Loan record not found.');
  if (loan.returned_on) throw new HttpError(400, 'This book has already been returned.');

  const body = await req.json().catch(() => ({}));
  const returnDate = body.returned_on || new Date().toISOString().split('T')[0];

  await run('UPDATE book_loans SET returned_on = ? WHERE id = ?', [returnDate, loanId]);

  return json({ ok: true, returned_on: returnDate });
});
