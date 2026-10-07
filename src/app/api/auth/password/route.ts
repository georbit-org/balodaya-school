import bcrypt from 'bcryptjs';
import { requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
import { createSession } from '@/server/session';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  const sessionUser = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    throw new HttpError(400, 'Current password and new password are required.');
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters long.');
  }

  const user = await one<{ id: number; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE id = ?',
    [sessionUser.id]
  );

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const match = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!match) {
    throw new HttpError(400, 'Current password does not match.');
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [
    newHash,
    user.id,
  ]);

  // Refresh session token with mustChangePassword = false
  await createSession({
    ...sessionUser,
    mustChangePassword: false,
  });

  return json({ success: true, message: 'Password updated successfully.' });
});
