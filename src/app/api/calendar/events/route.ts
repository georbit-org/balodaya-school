import { requireUser, requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { query, one, run } from '@/server/db';

export const GET = handle(async () => {
  await requireUser();
  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  const yearId = currentYear?.id ?? 1;

  const items = await query(`
    SELECT sc.*, u.name as created_by_name
    FROM school_calendar sc
    LEFT JOIN users u ON sc.created_by = u.id
    WHERE sc.academic_year_id = ?
    ORDER BY sc.date ASC
  `, [yearId]);

  return json({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireRole('admin', 'principal');
  const body = await req.json().catch(() => ({}));
  const { date, end_date, kind, title, title_ne, applies_to = 'all' } = body;

  if (!date || !kind || !title?.trim()) {
    throw new HttpError(400, 'Date, kind, and title are required.');
  }

  const validKinds = ['holiday', 'vacation', 'exam_day', 'event', 'half_day', 'working_override'];
  if (!validKinds.includes(kind)) {
    throw new HttpError(400, `Kind must be one of: ${validKinds.join(', ')}`);
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  const yearId = currentYear?.id ?? 1;

  const res = await run(
    `INSERT INTO school_calendar (academic_year_id, date, end_date, kind, title, title_ne, applies_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [yearId, date, end_date || null, kind, title.trim(), title_ne?.trim() || null, applies_to, user.id]
  );

  return json({ id: Number(res.lastInsertRowid), success: true }, 201);
});
