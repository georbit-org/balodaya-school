import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const route = await one<{
    id: number;
    name: string;
    vehicle_no: string | null;
    driver_name: string | null;
    driver_phone: string | null;
    monthly_fee: number;
  }>('SELECT * FROM transport_routes WHERE id = ?', [routeId]);

  if (!route) throw new HttpError(404, 'Route not found.');

  const stops = await query(
    'SELECT * FROM transport_stops WHERE route_id = ? ORDER BY sort_order ASC, id ASC',
    [routeId]
  );

  return json({ ...route, stops });
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const body = await req.json().catch(() => ({}));
  const { name, vehicle_no, driver_name, driver_phone, monthly_fee } = body;

  const existing = await one<{ id: number }>('SELECT id FROM transport_routes WHERE id = ?', [routeId]);
  if (!existing) throw new HttpError(404, 'Route not found.');

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (name !== undefined) {
    if (!name.trim()) throw new HttpError(400, 'Route name cannot be blank.');
    updates.push('name = ?');
    args.push(name.trim());
  }
  if (vehicle_no !== undefined) {
    updates.push('vehicle_no = ?');
    args.push(vehicle_no?.trim() || null);
  }
  if (driver_name !== undefined) {
    updates.push('driver_name = ?');
    args.push(driver_name?.trim() || null);
  }
  if (driver_phone !== undefined) {
    updates.push('driver_phone = ?');
    args.push(driver_phone?.trim() || null);
  }
  if (monthly_fee !== undefined) {
    const fee = parseInt(monthly_fee, 10) || 0;
    updates.push('monthly_fee = ?');
    args.push(fee);
  }

  if (updates.length > 0) {
    args.push(routeId);
    await run(`UPDATE transport_routes SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const count = await one<{ count: number }>(
    'SELECT COUNT(*) as count FROM student_transport WHERE route_id = ?',
    [routeId]
  );
  if (count && count.count > 0) {
    throw new HttpError(400, `Cannot delete route with ${count.count} assigned passengers. Unassign students first.`);
  }

  await run('DELETE FROM transport_routes WHERE id = ?', [routeId]);
  return json({ ok: true });
});
