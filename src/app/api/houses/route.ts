import { readSession } from '@/server/session';
import { query } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  // Public or authenticated can view house totals
  const houses = await query<{
    id: number;
    name: string;
    motto: string;
    total_points: number;
    student_count: number;
  }>(`
    SELECT h.id, h.name, h.motto,
           COALESCE((SELECT SUM(hp.points) FROM house_points hp WHERE hp.house_id = h.id), 0) AS total_points,
           COALESCE((SELECT COUNT(*) FROM students s WHERE s.house_id = h.id AND s.status = 'active'), 0) AS student_count
    FROM houses h
    ORDER BY total_points DESC, h.name ASC
  `);

  return json({ houses });
});
