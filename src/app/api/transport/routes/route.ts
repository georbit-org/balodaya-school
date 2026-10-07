import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  if (!session) throw new HttpError(401, 'Unauthorized');

  const routes = await query(`
    SELECT r.id, r.name, r.vehicle_no, r.driver_name, r.driver_phone, r.monthly_fee,
           (SELECT COUNT(*) FROM transport_stops s WHERE s.route_id = r.id) AS stop_count,
           (SELECT COUNT(*) FROM student_transport st WHERE st.route_id = r.id) AS passenger_count
    FROM transport_routes r
    ORDER BY r.name ASC
  `);

  return json({ routes });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const { name, vehicle_no, driver_name, driver_phone, monthly_fee } = body;

  if (!name?.trim()) {
    throw new HttpError(400, 'Route name is required.');
  }

  const existing = await one<{ id: number }>('SELECT id FROM transport_routes WHERE name = ?', [name.trim()]);
  if (existing) {
    throw new HttpError(409, `Route "${name}" already exists.`);
  }

  const fee = parseInt(monthly_fee ?? '0', 10) || 0;

  const res = await run(
    `INSERT INTO transport_routes (name, vehicle_no, driver_name, driver_phone, monthly_fee)
     VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), vehicle_no?.trim() || null, driver_name?.trim() || null, driver_phone?.trim() || null, fee]
  );

  return json({ id: Number(res.lastInsertRowid), name: name.trim() }, 201);
});
