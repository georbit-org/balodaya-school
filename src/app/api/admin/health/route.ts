import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import { checkSystemHealth } from '@/server/health';

export const GET = handle(async () => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'settings.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: settings.manage required');
  }

  const result = await checkSystemHealth();
  return json(result);
});
