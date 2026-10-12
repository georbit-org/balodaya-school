import { redirect } from 'next/navigation';
import { readSession, type SessionUser } from './session';
import { HttpError } from './http';
import { type Action } from '@/lib/permissions';
import { canServer } from './permissions';

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

export async function requireAction(action: Action): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = await canServer(user.role, action);
  if (!allowed) {
    throw new HttpError(403, 'You do not have permission to perform this action.');
  }
  return user;
}

export async function requirePage(...roles: SessionUser['role'][]): Promise<SessionUser> {
  const user = await readSession();
  if (!user) {
    redirect('/login');
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    redirect('/app/dashboard');
  }
  return user;
}
