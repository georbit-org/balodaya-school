import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fields = fields;
  }
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonOk(data: unknown = { ok: true }, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonUnauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function jsonForbidden(message = 'Permission denied'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function jsonBadRequest(message = 'Bad Request', fields?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: message, ...(fields ? { fields } : {}) }, { status: 400 });
}

export function jsonNotFound(message = 'Record not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function handle<T = unknown>(
  fn: (req: Request, context: T) => Promise<Response>
): (req: Request, context: T) => Promise<Response> {
  return async (req: Request, context: T) => {
    try {
      return await fn(req, context);
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return json(
          { error: err.message, ...(err.fields ? { fields: err.fields } : {}) },
          err.status
        );
      }

      // Check for ZodError or generic validation
      if (typeof err === 'object' && err !== null && 'issues' in err) {
        const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        const fields: Record<string, string> = {};
        for (const issue of issues) {
          const field = issue.path.join('.');
          fields[field] = issue.message;
        }
        return json({ error: 'Validation failed', fields }, 400);
      }

      console.error('Unhandled server error:', err);
      return json({ error: 'An unexpected internal error occurred. Please try again.' }, 500);
    }
  };
}

// In-memory rate limiting map: ip -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(req: Request, limit = process.env.NODE_ENV === 'production' ? 10 : 100, windowMs = 60_000): boolean {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
