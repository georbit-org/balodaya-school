import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { student_id, route_id, stop_id } = body;

  const studentId = parseInt(student_id, 10);
  if (isNaN(studentId)) {
    throw new HttpError(400, 'Valid student ID is required.');
  }

  const student = await one<{ id: number }>('SELECT id FROM students WHERE id = ?', [studentId]);
  if (!student) throw new HttpError(404, 'Student not found.');

  // If route_id is falsey, unassign
  if (!route_id) {
    await run('DELETE FROM student_transport WHERE student_id = ?', [studentId]);
    return json({ ok: true, unassigned: true });
  }

  const routeId = parseInt(route_id, 10);
  const route = await one<{ id: number }>('SELECT id FROM transport_routes WHERE id = ?', [routeId]);
  if (!route) throw new HttpError(404, 'Transport route not found.');

  const stopId = stop_id ? parseInt(stop_id, 10) : null;

  await run(
    `INSERT INTO student_transport (student_id, route_id, stop_id)
     VALUES (?, ?, ?)
     ON CONFLICT(student_id) DO UPDATE SET
       route_id = excluded.route_id,
       stop_id = excluded.stop_id`,
    [studentId, routeId, stopId]
  );

  return json({ ok: true, student_id: studentId, route_id: routeId, stop_id: stopId });
});
