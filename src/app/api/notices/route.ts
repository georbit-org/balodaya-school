import { readSession } from '@/server/session';
import { requireUser } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const audience = url.searchParams.get('audience');

  let sql = `
    SELECT n.id, n.title, n.body, n.kind, n.audience, n.event_date,
           n.attachment_path, n.published, n.created_at,
           u.name as author_name
    FROM notices n
    LEFT JOIN users u ON n.created_by = u.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  // Public visitor / unauthenticated user
  if (!session) {
    sql += " AND n.published = 1 AND n.audience = 'public'";
  } else if (session.role === 'admin' || session.role === 'principal') {
    // Admin & principal see all
  } else if (session.role === 'teacher') {
    sql += " AND (n.audience IN ('public', 'staff') OR n.created_by = ?)";
    args.push(session.id);
  } else if (session.role === 'parent') {
    sql += " AND n.published = 1 AND n.audience IN ('public', 'parents')";
  } else if (session.role === 'student') {
    sql += " AND n.published = 1 AND n.audience IN ('public', 'students')";
  }

  if (kind) {
    sql += ' AND n.kind = ?';
    args.push(kind);
  }

  if (audience && session && (session.role === 'admin' || session.role === 'principal')) {
    sql += ' AND n.audience = ?';
    args.push(audience);
  }

  sql += ' ORDER BY n.id DESC';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const {
    title,
    body: content,
    kind = 'notice',
    audience = 'public',
    event_date = null,
    attachment_path = null,
    published = 1,
  } = body;

  if (!title?.trim() || !content?.trim()) {
    throw new HttpError(400, 'Title and notice body are required.');
  }

  // Teachers can only post to staff or students
  if (user.role === 'teacher' && audience === 'public') {
    throw new HttpError(403, 'Teachers can only post notices for staff or students.');
  }

  const res = await run(
    `INSERT INTO notices (title, body, kind, audience, event_date, attachment_path, published, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      content.trim(),
      kind,
      audience,
      event_date || null,
      attachment_path || null,
      published ? 1 : 0,
      user.id,
    ]
  );

  return json({ id: Number(res.lastInsertRowid) }, 201);
});
