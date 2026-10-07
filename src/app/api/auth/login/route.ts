import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { one } from '@/server/db';
import { createSession } from '@/server/session';
import { handle, json, HttpError, checkRateLimit } from '@/server/http';

export const POST = handle(async (req: Request) => {
  if (!checkRateLimit(req)) {
    throw new HttpError(429, 'Too many login attempts. Please wait a minute before trying again.');
  }

  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  const cleanEmail = email.trim().toLowerCase();

  const user = await one<{
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'principal' | 'teacher' | 'accountant' | 'parent' | 'student';
    password_hash: string;
    must_change_password: number;
    active: number;
  }>('SELECT id, email, name, role, password_hash, must_change_password, active FROM users WHERE lower(email) = ? AND active = 1', [
    cleanEmail,
  ]);

  if (!user) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: Boolean(user.must_change_password),
  };

  await createSession(sessionUser);

  return json({
    user: sessionUser,
  });
});
