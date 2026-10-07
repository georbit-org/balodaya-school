import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const stops = await query(
    'SELECT * FROM transport_stops WHERE route_id = ? ORDER BY sort_order ASC, id ASC',
    [routeId]
  );
  return json({ stops });
});

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const routeId = parseInt(id, 10);
  if (isNaN(routeId)) throw new HttpError(400, 'Invalid route ID.');

  const body = await req.json().catch(() => ({}));
  const { name, pickup_time, sort_order } = body;

  if (!name?.trim()) {
    throw new HttpError(400, 'Stop name is required.');
  }

  const res = await run(
    `INSERT INTO transport_stops (route_id, name, pickup_time, sort_order)
     VALUES (?, ?, ?, ?)`,
    [routeId, name.trim(), pickup_time?.trim() || null, parseInt(sort_order, 10) || 0]
  );

  return json({ id: Number(res.lastInsertRowid), name: name.trim() }, 201);
});
