import { requireRole } from '@/server/guard';
import { run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { assignments } = body;

  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new HttpError(400, 'Assignments array is required.');
  }

  let updated = 0;
  for (const item of assignments) {
    const studentId = parseInt(item.student_id, 10);
    const houseId = item.house_id ? parseInt(item.house_id, 10) : null;
    if (studentId) {
      await run('UPDATE students SET house_id = ? WHERE id = ?', [houseId, studentId]);
      updated++;
    }
  }

  return json({ ok: true, count: updated });
});
