import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const status = url.searchParams.get('status');

  const isStaff = session && (session.role === 'admin' || session.role === 'principal');

  // If public visitor, can only fetch published testimonials or alumni
  if (!isStaff) {
    if (kind !== 'testimonial' && kind !== 'alumni') {
      throw new HttpError(401, 'Unauthorized');
    }
  }

  let sql = 'SELECT * FROM messages WHERE 1=1';
  const args: (string | number)[] = [];

  if (!isStaff) {
    sql += " AND status = 'published'";
  } else if (status && status !== 'all') {
    sql += ' AND status = ?';
    args.push(status);
  }

  if (kind && kind !== 'all') {
    sql += ' AND kind = ?';
    args.push(kind);
  }

  sql += ' ORDER BY id DESC';

  const messages = await query(sql, args);
  return json({ messages });
});

export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));

  // Honeypot guard
  if (body.website) {
    return json({ ok: true });
  }

  const { kind, name, phone, email, subject, body: messageBody, extra } = body;

  if (!kind || !['contact', 'transfer-certificate', 'testimonial', 'alumni'].includes(kind)) {
    throw new HttpError(400, 'Valid message kind is required.');
  }

  if (!name?.trim()) {
    throw new HttpError(400, 'Your name is required.');
  }

  if (!messageBody?.trim()) {
    throw new HttpError(400, 'Message body is required.');
  }

  const extraJson = typeof extra === 'object' ? JSON.stringify(extra) : (typeof extra === 'string' ? extra : null);

  const res = await run(
    `INSERT INTO messages (kind, name, phone, email, subject, body, extra, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
    [
      kind,
      name.trim(),
      phone?.trim() || null,
      email?.trim() || null,
      subject?.trim() || null,
      messageBody.trim(),
      extraJson,
    ]
  );

  return json({ ok: true, id: Number(res.lastInsertRowid) }, 201);
});
