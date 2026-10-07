import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const staff = await requireRole('admin', 'principal');
  const params = await context?.params;
  const appId = parseInt(params?.id || '', 10);

  if (isNaN(appId)) {
    throw new HttpError(400, 'Invalid application ID.');
  }

  const app = await one<{ id: number; status: string }>('SELECT id, status FROM applications WHERE id = ?', [
    appId,
  ]);
  if (!app) {
    throw new HttpError(404, 'Application not found.');
  }

  const body = await req.json().catch(() => ({}));
  const { status, notes } = body;

  const validStatuses = ['new', 'reviewing', 'accepted', 'rejected', 'enrolled'];
  if (status && !validStatuses.includes(status)) {
    throw new HttpError(400, 'Invalid application status.');
  }

  const newStatus = status || app.status;

  await run(
    'UPDATE applications SET status = ?, notes = COALESCE(?, notes) WHERE id = ?',
    [newStatus, notes, appId]
  );

  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'update_application', 'applications', ?, ?)`,
    [staff.id, appId, `Updated application status to ${newStatus}`]
  );

  return json({ success: true, status: newStatus });
});
