import { readSession } from '@/server/session';
import { query, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await readSession();
  if (!session) throw new HttpError(401, 'Unauthorized');

  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const route = await one<{ id: number; name: string }>('SELECT id, name FROM transport_routes WHERE id = ?', [routeId]);
  if (!route) throw new HttpError(404, 'Route not found.');

  const passengers = await query(`
    SELECT st.student_id, s.admission_no, s.full_name, s.gender,
           c.name as class_name, sec.name as section_name,
           ts.name as stop_name, ts.pickup_time,
           (SELECT phone FROM student_guardians sg WHERE sg.student_id = s.id AND sg.is_primary = 1 LIMIT 1) as guardian_phone
    FROM student_transport st
    JOIN students s ON st.student_id = s.id
    LEFT JOIN transport_stops ts ON st.stop_id = ts.id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    WHERE st.route_id = ?
    ORDER BY ts.sort_order ASC, s.full_name ASC
  `, [routeId]);

  return json({ route, passengers });
});
