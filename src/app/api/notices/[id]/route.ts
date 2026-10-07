import { requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const params = await context?.params;
  const noticeId = parseInt(params?.id || '', 10);
  if (isNaN(noticeId)) throw new HttpError(400, 'Invalid notice ID.');

  const notice = await one<{
    id: number;
    title: string;
    body: string;
    kind: string;
    audience: string;
    event_date: string | null;
    attachment_path: string | null;
    published: number;
    created_at: string;
    author_name: string | null;
  }>(
    `SELECT n.*, u.name as author_name
     FROM notices n
     LEFT JOIN users u ON n.created_by = u.id
     WHERE n.id = ?`,
    [noticeId]
  );

  if (!notice) throw new HttpError(404, 'Notice not found.');
  return json({ notice });
});

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const noticeId = parseInt(params?.id || '', 10);
  if (isNaN(noticeId)) throw new HttpError(400, 'Invalid notice ID.');

  const existing = await one<{ id: number; created_by: number | null }>('SELECT id, created_by FROM notices WHERE id = ?', [noticeId]);
  if (!existing) throw new HttpError(404, 'Notice not found.');

  if (user.role !== 'admin' && user.role !== 'principal' && existing.created_by !== user.id) {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const { title, body: content, kind, audience, event_date, attachment_path, published } = body;

  await run(
    `UPDATE notices
     SET title = COALESCE(?, title),
         body = COALESCE(?, body),
         kind = COALESCE(?, kind),
         audience = COALESCE(?, audience),
         event_date = COALESCE(?, event_date),
         attachment_path = COALESCE(?, attachment_path),
         published = COALESCE(?, published)
     WHERE id = ?`,
    [
      title !== undefined ? title.trim() : null,
      content !== undefined ? content.trim() : null,
      kind ?? null,
      audience ?? null,
      event_date ?? null,
      attachment_path ?? null,
      published !== undefined ? (published ? 1 : 0) : null,
      noticeId,
    ]
  );

  return json({ success: true });
});

export const DELETE = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const noticeId = parseInt(params?.id || '', 10);
  if (isNaN(noticeId)) throw new HttpError(400, 'Invalid notice ID.');

  if (user.role !== 'admin' && user.role !== 'principal') {
    throw new HttpError(403, 'Permission denied.');
  }

  await run('DELETE FROM notices WHERE id = ?', [noticeId]);
  return json({ success: true });
});
