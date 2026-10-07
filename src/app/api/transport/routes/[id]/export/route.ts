import { readSession } from '@/server/session';
import { query, one } from '@/server/db';
import { handle, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await readSession();
  if (!session) throw new HttpError(401, 'Unauthorized');

  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const route = await one<{ id: number; name: string; vehicle_no: string | null; driver_name: string | null }>(
    'SELECT id, name, vehicle_no, driver_name FROM transport_routes WHERE id = ?',
    [routeId]
  );
  if (!route) throw new HttpError(404, 'Route not found.');

  const passengers = await query<{
    admission_no: string;
    full_name: string;
    class_name: string | null;
    section_name: string | null;
    stop_name: string | null;
    pickup_time: string | null;
    guardian_phone: string | null;
  }>(`
    SELECT s.admission_no, s.full_name,
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

  const escapeCsv = (str: string | null | undefined) => {
    if (!str) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const header = ['Admission No', 'Student Name', 'Class', 'Section', 'Designated Stop', 'Pickup Time', 'Parent Phone'];
  const lines = [
    header.join(','),
    ...passengers.map((p) =>
      [
        escapeCsv(p.admission_no),
        escapeCsv(p.full_name),
        escapeCsv(p.class_name),
        escapeCsv(p.section_name),
        escapeCsv(p.stop_name),
        escapeCsv(p.pickup_time),
        escapeCsv(p.guardian_phone),
      ].join(',')
    ),
  ];

  const bom = '\uFEFF';
  const csvContent = bom + lines.join('\r\n');

  const filename = `transport-roster-${route.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
