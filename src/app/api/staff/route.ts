import { readSession } from '@/server/session';
import { query } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  if (!session) throw new HttpError(401, 'Unauthorized');

  const url = new URL(req.url);
  const role = url.searchParams.get('role');
  const q = url.searchParams.get('q')?.trim();

  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.designation, u.role, u.active,
           (
             SELECT GROUP_CONCAT(c.name || ': ' || s.name, ', ')
             FROM class_subjects cs
             JOIN classes c ON cs.class_id = c.id
             JOIN subjects s ON cs.subject_id = s.id
             WHERE cs.teacher_id = u.id
           ) AS assigned_subjects,
           (
             SELECT GROUP_CONCAT(c.name || ' (' || sec.name || ')', ', ')
             FROM sections sec
             JOIN classes c ON sec.class_id = c.id
             WHERE sec.class_teacher_id = u.id
           ) AS class_teacher_of
    FROM users u
    WHERE u.role IN ('teacher', 'principal', 'accountant', 'admin')
  `;
  const args: (string | number)[] = [];

  if (role && role !== 'all') {
    sql += ' AND u.role = ?';
    args.push(role);
  }

  if (q) {
    sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.designation LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term, term);
  }

  sql += `
    ORDER BY CASE u.role
      WHEN 'principal' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'teacher' THEN 3
      ELSE 4
    END, u.name ASC
  `;

  const staff = await query(sql, args);
  return json({ staff });
});
