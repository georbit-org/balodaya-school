import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default institutional admin credentials (can be overridden by environment variables)
const VALID_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const VALID_PASSWORD = process.env.ADMIN_PASSWORD || 'balodaya2063';
const SESSION_COOKIE_NAME = 'balodaya_admin_session';
const SESSION_SECRET_TOKEN = 'balodaya-secure-session-auth-token-2063';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    if (cleanUsername === VALID_USERNAME && cleanPassword === VALID_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, SESSION_SECRET_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          username: cleanUsername,
          role: 'Institutional Administrator',
          campus: 'Sundar Bazar, Bheerkot-06',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid administrator credentials. Please check username and password.' },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed due to a server error.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);

    if (session && session.value === SESSION_SECRET_TOKEN) {
      return NextResponse.json({
        authenticated: true,
        user: {
          username: VALID_USERNAME,
          role: 'Institutional Administrator',
          campus: 'Sundar Bazar, Bheerkot-06',
        },
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: 'Signed out successfully.' });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
