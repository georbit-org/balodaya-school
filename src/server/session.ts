import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'balodaya_session';
const DEFAULT_SECRET = 'balodaya-default-secret-change-in-production-min-32-chars';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is strictly required in production.');
    }
    return new TextEncoder().encode(DEFAULT_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'principal' | 'teacher' | 'accountant' | 'parent' | 'student';
  mustChangePassword: boolean;
}

export async function createSession(user: SessionUser): Promise<string> {
  const secretKey = getSecretKey();

  const token = await new SignJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });

  return token;
}

export async function readSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    return {
      id: Number(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionUser['role'],
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
