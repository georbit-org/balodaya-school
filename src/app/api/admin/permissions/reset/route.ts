import { requireRole } from '@/server/guard';
import { handle, json } from '@/server/http';
import { run } from '@/server/db';
import { audit } from '@/server/audit';
import { invalidatePermissionCache } from '@/server/permissions';

export const POST = handle(async (req: Request) => {
  const adminUser = await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { role, action } = body;

  if (role && action) {
    await run('DELETE FROM role_permission_overrides WHERE role = ? AND action = ?', [role, action]);
  } else if (role) {
    await run('DELETE FROM role_permission_overrides WHERE role = ?', [role]);
  } else {
    await run('DELETE FROM role_permission_overrides');
  }

  invalidatePermissionCache();
  await audit(adminUser.id, 'reset_permission_overrides', 'role_permission_overrides', null, { role, action });

  return json({ message: 'Permissions reset to system defaults successfully.' });
});
