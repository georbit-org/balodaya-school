import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string; stopId: string }> }) => {
  await requireRole('admin', 'principal');
  const { id, stopId } = await ctx.params;
  const routeId = parseInt(id, 10);
  const sId = parseInt(stopId, 10);
  if (isNaN(routeId) || isNaN(sId)) throw new HttpError(400, 'Invalid parameters.');

  // Check if students are using this stop
  const inUse = await one<{ count: number }>(
    'SELECT COUNT(*) as count FROM student_transport WHERE stop_id = ?',
    [sId]
  );
  if (inUse && inUse.count > 0) {
    throw new HttpError(400, 'Cannot delete stop while students are assigned to it.');
  }

  await run('DELETE FROM transport_stops WHERE id = ? AND route_id = ?', [sId, routeId]);
  return json({ ok: true });
});
