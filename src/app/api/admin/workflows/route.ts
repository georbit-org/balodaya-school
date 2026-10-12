import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import { listWorkflows, saveWorkflow } from '@/server/workflows';

export const GET = handle(async () => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'settings.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: settings.manage required');
  }

  const workflows = await listWorkflows();
  return json(workflows);
});

export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'settings.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: settings.manage required');
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || !body.id || !Array.isArray(body.steps)) {
    throw new HttpError(400, 'Workflow "id" and "steps" array are required.');
  }

  const updated = await saveWorkflow(
    body.id,
    {
      active: body.active !== undefined ? Number(body.active) : 1,
      steps: body.steps,
    },
    user.id
  );

  return json(updated);
});
