import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const msgId = parseInt(id, 10);
  if (isNaN(msgId)) throw new HttpError(400, 'Invalid message ID.');

  const item = await one('SELECT * FROM messages WHERE id = ?', [msgId]);
  if (!item) throw new HttpError(404, 'Message not found.');

  return json({ message: item });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const msgId = parseInt(id, 10);
  if (isNaN(msgId)) throw new HttpError(400, 'Invalid message ID.');

  const existing = await one<{ id: number }>('SELECT id FROM messages WHERE id = ?', [msgId]);
  if (!existing) throw new HttpError(404, 'Message not found.');

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!status || !['new', 'read', 'done', 'published', 'hidden'].includes(status)) {
    throw new HttpError(400, 'Invalid status.');
  }

  await run('UPDATE messages SET status = ? WHERE id = ?', [status, msgId]);
  return json({ ok: true, status });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const msgId = parseInt(id, 10);
  if (isNaN(msgId)) throw new HttpError(400, 'Invalid message ID.');

  await run('DELETE FROM messages WHERE id = ?', [msgId]);
  return json({ ok: true });
});
