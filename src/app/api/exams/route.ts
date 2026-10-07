import { requireUser, requireRole } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const user = await requireUser();
  const currentYear = await one<{ id: number; name: string }>(
    'SELECT id, name FROM academic_years WHERE is_current = 1'
  );

  let sql = `
    SELECT e.id, e.name, e.start_date, e.end_date, e.published, e.public_results,
           ay.name as academic_year_name
    FROM exams e
    JOIN academic_years ay ON e.academic_year_id = ay.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (currentYear) {
    sql += ' AND e.academic_year_id = ?';
    args.push(currentYear.id);
  }

  // Parents and students can only view published exams
  if (user.role === 'parent' || user.role === 'student') {
    sql += ' AND e.published = 1';
  }

  sql += ' ORDER BY e.id DESC';

  const items = await query(sql, args);
  return json({ items, currentYear: currentYear?.name ?? null });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { name, start_date = null, end_date = null, public_results = false } = body;

  if (!name?.trim()) {
    throw new HttpError(400, 'Exam name is required.');
  }

  const currentYear = await one<{ id: number }>(
    'SELECT id FROM academic_years WHERE is_current = 1'
  );
  if (!currentYear) {
    throw new HttpError(500, 'No active academic year configured.');
  }

  const res = await run(
    `INSERT INTO exams (academic_year_id, name, start_date, end_date, published, public_results)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [currentYear.id, name.trim(), start_date, end_date, public_results ? 1 : 0]
  );

  return json({ id: Number(res.lastInsertRowid) }, 201);
});
