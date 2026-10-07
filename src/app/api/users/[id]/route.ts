import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole('admin');
  const params = await context?.params;
  const targetId = parseInt(params?.id || '', 10);

  if (isNaN(targetId)) {
    throw new HttpError(400, 'Invalid user ID.');
  }

  const user = await one<{ id: number; role: string; active: number }>(
    'SELECT id, role, active FROM users WHERE id = ?',
    [targetId]
  );

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const body = await req.json().catch(() => ({}));
  const { role, active, designation, phone, name } = body;

  // Safety check: an admin cannot demote or deactivate themselves
  if (user.id === admin.id) {
    if (active === 0 || active === false) {
      throw new HttpError(400, 'You cannot deactivate your own administrator account.');
    }
    if (role && role !== 'admin') {
      throw new HttpError(400, 'You cannot change your own administrator role.');
    }
  }

  const newRole = role !== undefined ? role : user.role;
  const newActive = active !== undefined ? (active ? 1 : 0) : user.active;

  await run(
    `UPDATE users
     SET role = ?, active = ?, designation = COALESCE(?, designation),
         phone = COALESCE(?, phone), name = COALESCE(?, name)
     WHERE id = ?`,
    [newRole, newActive, designation, phone, name, targetId]
  );

  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'update_user', 'users', ?, ?)`,
    [admin.id, targetId, `Updated user ${targetId} (role: ${newRole}, active: ${newActive})`]
  );

  return json({ success: true });
});
