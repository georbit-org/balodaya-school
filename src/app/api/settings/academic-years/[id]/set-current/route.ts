import { requireRole } from '@/server/guard';
import { run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin');
  const params = await context?.params;
  const yearId = parseInt(params?.id || '', 10);

  if (isNaN(yearId)) {
    throw new HttpError(400, 'Invalid academic year ID.');
  }

  // Set all is_current = 0, then target = 1
  await run('UPDATE academic_years SET is_current = 0');
  await run('UPDATE academic_years SET is_current = 1 WHERE id = ?', [yearId]);

  return json({ success: true });
});
