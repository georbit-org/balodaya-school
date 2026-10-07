import { readSession } from '@/server/session';
import { requireUser } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const classId = url.searchParams.get('class_id');
  const subjectId = url.searchParams.get('subject_id');
  const q = url.searchParams.get('q')?.trim();

  let sql = `
    SELECT r.id, r.kind, r.title, r.class_id, r.subject_id,
           r.file_path, r.published, r.created_at,
           c.name as class_name, sub.name as subject_name,
           u.name as uploaded_by_name
    FROM resources r
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN subjects sub ON r.subject_id = sub.id
    LEFT JOIN users u ON r.uploaded_by = u.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  // Visibility: unauthenticated visitors or parents/students see only published items
  const isStaff = session && (session.role === 'admin' || session.role === 'principal' || session.role === 'teacher');
  if (!isStaff) {
    sql += ' AND r.published = 1';
  }

  if (kind && kind !== 'all') {
    sql += ' AND r.kind = ?';
    args.push(kind);
  }

  if (classId) {
    sql += ' AND r.class_id = ?';
    args.push(parseInt(classId, 10));
  }

  if (subjectId) {
    sql += ' AND r.subject_id = ?';
    args.push(parseInt(subjectId, 10));
  }

  if (q) {
    sql += ' AND (r.title LIKE ? OR c.name LIKE ? OR sub.name LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term);
  }

  sql += ' ORDER BY r.id DESC';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const { kind, title, class_id, subject_id, file_path, published } = body;

  if (!title?.trim()) {
    throw new HttpError(400, 'Resource title is required.');
  }

  if (!kind || !['question-bank', 'exam-portion', 'policy', 'other'].includes(kind)) {
    throw new HttpError(400, 'Valid resource kind is required.');
  }

  if (!file_path?.trim()) {
    throw new HttpError(400, 'File path or uploaded document is required.');
  }

  const isPub = published === false || published === 0 ? 0 : 1;
  const clsId = class_id ? parseInt(class_id, 10) : null;
  const subId = subject_id ? parseInt(subject_id, 10) : null;

  const res = await run(
    `INSERT INTO resources (kind, title, class_id, subject_id, file_path, published, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [kind, title.trim(), clsId, subId, file_path.trim(), isPub, user.id]
  );

  return json({ id: Number(res.lastInsertRowid), title: title.trim(), published: isPub }, 201);
});
