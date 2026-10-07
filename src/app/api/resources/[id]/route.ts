import { requireUser } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const resId = parseInt(id, 10);
  if (isNaN(resId)) throw new HttpError(400, 'Invalid resource ID.');

  const item = await one('SELECT * FROM resources WHERE id = ?', [resId]);
  if (!item) throw new HttpError(404, 'Resource not found.');

  return json({ item });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const { id } = await ctx.params;
  const resId = parseInt(id, 10);
  if (isNaN(resId)) throw new HttpError(400, 'Invalid resource ID.');

  const existing = await one<{ id: number }>('SELECT id FROM resources WHERE id = ?', [resId]);
  if (!existing) throw new HttpError(404, 'Resource not found.');

  const body = await req.json().catch(() => ({}));
  const { title, kind, class_id, subject_id, published } = body;

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (title !== undefined) {
    if (!title.trim()) throw new HttpError(400, 'Title cannot be blank.');
    updates.push('title = ?');
    args.push(title.trim());
  }
  if (kind !== undefined) {
    updates.push('kind = ?');
    args.push(kind);
  }
  if (class_id !== undefined) {
    updates.push('class_id = ?');
    args.push(class_id ? parseInt(class_id, 10) : null);
  }
  if (subject_id !== undefined) {
    updates.push('subject_id = ?');
    args.push(subject_id ? parseInt(subject_id, 10) : null);
  }
  if (published !== undefined) {
    updates.push('published = ?');
    args.push(published ? 1 : 0);
  }

  if (updates.length > 0) {
    args.push(resId);
    await run(`UPDATE resources SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const { id } = await ctx.params;
  const resId = parseInt(id, 10);
  if (isNaN(resId)) throw new HttpError(400, 'Invalid resource ID.');

  await run('DELETE FROM resources WHERE id = ?', [resId]);
  return json({ ok: true });
});
