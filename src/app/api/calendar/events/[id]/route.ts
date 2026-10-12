import { requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { run, one } from '@/server/db';

export const DELETE = handle(async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const params = await context?.params;
  const id = parseInt(params?.id || '', 10);
  if (isNaN(id)) throw new HttpError(400, 'Invalid calendar event ID.');

  const existing = await one('SELECT id FROM school_calendar WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Calendar event not found.');

  await run('DELETE FROM school_calendar WHERE id = ?', [id]);
  return json({ success: true, id });
});
