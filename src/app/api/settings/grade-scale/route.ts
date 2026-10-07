import { query } from '@/server/db';
import { handle, json } from '@/server/http';

export const GET = handle(async () => {
  const grades = await query('SELECT id, min_percent, grade, gpa FROM grade_scale ORDER BY min_percent DESC');
  return json({ grades });
});
