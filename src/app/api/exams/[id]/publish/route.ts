import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireRole('admin', 'principal');
  const params = await context?.params;
  const examId = parseInt(params?.id || '', 10);
  if (isNaN(examId)) throw new HttpError(400, 'Invalid exam ID.');

  const exam = await one<{ id: number; name: string; published: number }>(
    'SELECT id, name, published FROM exams WHERE id = ?',
    [examId]
  );
  if (!exam) throw new HttpError(404, 'Exam not found.');

  const body = await req.json().catch(() => ({}));
  const unpublish = Boolean(body.unpublish);

  if (unpublish) {
    await run(
      `UPDATE exams SET published = 0, status = 'marks_open', published_at = NULL, published_by = NULL WHERE id = ?`,
      [examId]
    );
    return json({ success: true, published: false, status: 'marks_open' });
  }

  await run(
    `UPDATE exams SET published = 1, status = 'published', published_at = datetime('now'), published_by = ? WHERE id = ?`,
    [user.id, examId]
  );

  return json({ success: true, published: true, status: 'published' });
});
