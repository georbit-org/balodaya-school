import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) throw new HttpError(400, 'Invalid application ID.');

  const existing = await one<{ id: number }>('SELECT id FROM job_applications WHERE id = ?', [appId]);
  if (!existing) throw new HttpError(404, 'Application not found.');

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!status || !['new', 'shortlisted', 'rejected', 'hired'].includes(status)) {
    throw new HttpError(400, 'Invalid application status.');
  }

  await run('UPDATE job_applications SET status = ? WHERE id = ?', [status, appId]);
  return json({ ok: true, status });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) throw new HttpError(400, 'Invalid application ID.');

  await run('DELETE FROM job_applications WHERE id = ?', [appId]);
  return json({ ok: true });
});
