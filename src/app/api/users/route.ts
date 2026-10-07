import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  await requireRole('admin');
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const role = url.searchParams.get('role') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10));
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT id, email, name, phone, designation, role, active, must_change_password, created_at FROM users WHERE 1=1';
  let countSql = 'SELECT count(*) as total FROM users WHERE 1=1';
  const args: (string | number)[] = [];
  const countArgs: (string | number)[] = [];

  if (role) {
    sql += ' AND role = ?';
    countSql += ' AND role = ?';
    args.push(role);
    countArgs.push(role);
  }

  if (q) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    countSql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term);
    countArgs.push(term, term, term);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  args.push(pageSize, offset);

  const [items, totalRow] = await Promise.all([
    query(sql, args),
    one<{ total: number }>(countSql, countArgs),
  ]);

  return json({
    items,
    total: totalRow?.total ?? 0,
    page,
    pageSize,
  });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { name, email, phone = null, role, designation = null } = body;

  if (!name || !email || !role) {
    throw new HttpError(400, 'Name, email, and role are required.');
  }

  const validRoles = ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'];
  if (!validRoles.includes(role)) {
    throw new HttpError(400, 'Invalid user role specified.');
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await one<{ id: number }>('SELECT id FROM users WHERE lower(email) = ?', [cleanEmail]);
  if (existing) {
    throw new HttpError(409, 'A user account with this email already exists.');
  }

  // Generate temporary 10-char password
  const temporaryPassword = crypto.randomBytes(6).toString('base64url');
  const passwordHash = bcrypt.hashSync(temporaryPassword, 10);

  const res = await run(
    `INSERT INTO users (email, name, phone, designation, role, password_hash, must_change_password, active)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
    [cleanEmail, name.trim(), phone, designation, role, passwordHash]
  );

  const newUserId = Number(res.lastInsertRowid);

  // Log in audit_log
  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'create_user', 'users', ?, ?)`,
    [admin.id, newUserId, `Created ${role} account for ${cleanEmail}`]
  );

  return json(
    {
      user: {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        role,
        designation,
      },
      temporaryPassword,
    },
    201
  );
});
