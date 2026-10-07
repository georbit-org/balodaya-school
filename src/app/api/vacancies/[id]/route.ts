import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const vacId = parseInt(id, 10);
  if (isNaN(vacId)) throw new HttpError(400, 'Invalid vacancy ID.');

  const item = await one('SELECT * FROM vacancies WHERE id = ?', [vacId]);
  if (!item) throw new HttpError(404, 'Vacancy not found.');

  return json({ vacancy: item });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const vacId = parseInt(id, 10);
  if (isNaN(vacId)) throw new HttpError(400, 'Invalid vacancy ID.');

  const existing = await one<{ id: number }>('SELECT id FROM vacancies WHERE id = ?', [vacId]);
  if (!existing) throw new HttpError(404, 'Vacancy not found.');

  const body = await req.json().catch(() => ({}));
  const { title, type, description, deadline, published } = body;

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (title !== undefined) {
    if (!title.trim()) throw new HttpError(400, 'Title cannot be blank.');
    updates.push('title = ?');
    args.push(title.trim());
  }
  if (type !== undefined) {
    if (type !== 'teaching' && type !== 'non-teaching') {
      throw new HttpError(400, 'Type must be teaching or non-teaching.');
    }
    updates.push('type = ?');
    args.push(type);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    args.push(description?.trim() || null);
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
    args.push(vacId);
    await run(`UPDATE vacancies SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const vacId = parseInt(id, 10);
  if (isNaN(vacId)) throw new HttpError(400, 'Invalid vacancy ID.');

  await run('DELETE FROM vacancies WHERE id = ?', [vacId]);
  return json({ ok: true });
});
