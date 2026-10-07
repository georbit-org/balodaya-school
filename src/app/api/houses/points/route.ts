import { requireUser } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const houseId = url.searchParams.get('house_id');

  let sql = `
    SELECT hp.id, hp.house_id, hp.points, hp.reason, hp.awarded_on,
           h.name as house_name, u.name as awarded_by_name
    FROM house_points hp
    JOIN houses h ON hp.house_id = h.id
    LEFT JOIN users u ON hp.awarded_by = u.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (houseId) {
    sql += ' AND hp.house_id = ?';
    args.push(parseInt(houseId, 10));
  }

  sql += ' ORDER BY hp.id DESC LIMIT 100';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const { house_id, points, reason, awarded_on } = body;

  const houseId = parseInt(house_id, 10);
  if (!houseId) throw new HttpError(400, 'Valid house ID is required.');

  const house = await one<{ id: number; name: string }>('SELECT id, name FROM houses WHERE id = ?', [houseId]);
  if (!house) throw new HttpError(404, 'House not found.');

  const pts = parseInt(points, 10);
  if (isNaN(pts) || pts === 0) {
    throw new HttpError(400, 'Points value cannot be zero.');
  }

  if (!reason?.trim()) {
    throw new HttpError(400, 'A reason for awarding or deducting points is required.');
  }

  const today = new Date().toISOString().split('T')[0];
  const dateStr = awarded_on || today;

  const res = await run(
    `INSERT INTO house_points (house_id, points, reason, awarded_on, awarded_by)
     VALUES (?, ?, ?, ?, ?)`,
    [houseId, pts, reason.trim(), dateStr, user.id]
  );

  return json(
    {
      id: Number(res.lastInsertRowid),
      house_id: houseId,
      house_name: house.name,
      points: pts,
      reason: reason.trim(),
    },
    201
  );
});
