import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const exam = await one<{
    id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    published: number;
    public_results: number;
    academic_year_name: string;
  }>(
    `SELECT e.*, ay.name as academic_year_name
     FROM exams e
     JOIN academic_years ay ON e.academic_year_id = ay.id
     WHERE e.id = ?`,
    [examId]
  );

  if (!exam) throw new HttpError(404, 'Exam not found.');

  return json({ exam });
});

export const PATCH = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const body = await req.json().catch(() => ({}));
  const { name, start_date, end_date, published, public_results } = body;

  await run(
    `UPDATE exams
     SET name = COALESCE(?, name),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         published = COALESCE(?, published),
         public_results = COALESCE(?, public_results)
     WHERE id = ?`,
    [
      name !== undefined ? name.trim() : null,
      start_date ?? null,
      end_date ?? null,
      published !== undefined ? (published ? 1 : 0) : null,
      public_results !== undefined ? (public_results ? 1 : 0) : null,
      examId,
    ]
  );

  return json({ success: true });
});
