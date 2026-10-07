import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const tId = parseInt(id, 10);
  if (isNaN(tId)) throw new HttpError(400, 'Invalid tender ID.');

  const item = await one('SELECT * FROM tenders WHERE id = ?', [tId]);
  if (!item) throw new HttpError(404, 'Tender not found.');

  return json({ tender: item });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const tId = parseInt(id, 10);
  if (isNaN(tId)) throw new HttpError(400, 'Invalid tender ID.');

  const existing = await one<{ id: number }>('SELECT id FROM tenders WHERE id = ?', [tId]);
  if (!existing) throw new HttpError(404, 'Tender not found.');

  const body = await req.json().catch(() => ({}));
  const { title, description, file_path, deadline, published } = body;

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (title !== undefined) {
    if (!title.trim()) throw new HttpError(400, 'Title cannot be blank.');
    updates.push('title = ?');
    args.push(title.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    args.push(description?.trim() || null);
  }
  if (file_path !== undefined) {
    updates.push('file_path = ?');
    args.push(file_path?.trim() || null);
  }
  if (deadline !== undefined) {
    updates.push('deadline = ?');
    args.push(deadline?.trim() || null);
  }
  if (published !== undefined) {
    updates.push('published = ?');
    args.push(published ? 1 : 0);
  }

  if (updates.length > 0) {
    args.push(tId);
    await run(`UPDATE tenders SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const tId = parseInt(id, 10);
  if (isNaN(tId)) throw new HttpError(400, 'Invalid tender ID.');

  await run('DELETE FROM tenders WHERE id = ?', [tId]);
  return json({ ok: true });
});
