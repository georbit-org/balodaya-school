import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole('admin');
  const params = await context?.params;
  const targetId = parseInt(params?.id || '', 10);

  if (isNaN(targetId)) {
    throw new HttpError(400, 'Invalid user ID.');
  }

  const user = await one<{ id: number; email: string }>('SELECT id, email FROM users WHERE id = ?', [
    targetId,
  ]);

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const temporaryPassword = crypto.randomBytes(6).toString('base64url');
  const passwordHash = bcrypt.hashSync(temporaryPassword, 10);

  await run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', [
    passwordHash,
    targetId,
  ]);

  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'reset_password', 'users', ?, ?)`,
    [admin.id, targetId, `Reset password for user ${user.email}`]
  );

  return json({
    success: true,
    temporaryPassword,
  });
});
