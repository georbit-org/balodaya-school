import { requireRole } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json } from '@/server/http';

export const GET = handle(async (req: Request) => {
  await requireRole('admin', 'principal');
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10));
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM applications WHERE 1=1';
  let countSql = 'SELECT count(*) as total FROM applications WHERE 1=1';
  const args: (string | number)[] = [];
  const countArgs: (string | number)[] = [];

  if (status) {
    sql += ' AND status = ?';
    countSql += ' AND status = ?';
    args.push(status);
    countArgs.push(status);
  }

  if (q) {
    sql += ' AND (student_name LIKE ? OR reference LIKE ? OR guardian_phone LIKE ? OR guardian_name LIKE ?)';
    countSql += ' AND (student_name LIKE ? OR reference LIKE ? OR guardian_phone LIKE ? OR guardian_name LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term, term);
    countArgs.push(term, term, term, term);
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
