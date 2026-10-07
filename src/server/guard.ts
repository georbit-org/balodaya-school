import { readSession, type SessionUser } from './session';
import { HttpError } from './http';

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return user;
}

export async function requireRole(...roles: SessionUser['role'][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to perform this action.');
  }
  return user;
}
