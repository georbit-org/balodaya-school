import { requireRole } from '@/server/guard';
import { query } from '@/server/db';
import { handle, json } from '@/server/http';

export const GET = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const vacancyId = url.searchParams.get('vacancy_id');

  let sql = `
    SELECT ja.id, ja.vacancy_id, ja.name, ja.phone, ja.email, ja.message,
           ja.cv_path, ja.status, ja.created_at,
           v.title as vacancy_title
    FROM job_applications ja
    LEFT JOIN vacancies v ON ja.vacancy_id = v.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (status && status !== 'all') {
    sql += ' AND ja.status = ?';
    args.push(status);
  }

  if (vacancyId) {
    sql += ' AND ja.vacancy_id = ?';
    args.push(parseInt(vacancyId, 10));
  }

  sql += ' ORDER BY ja.id DESC';

  const applications = await query(sql, args);
  return json({ applications });
});
