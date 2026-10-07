import { requireRole } from '@/server/guard';
import { run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const { id } = await ctx.params;
  const staffId = parseInt(id, 10);
  if (isNaN(staffId)) throw new HttpError(400, 'Invalid staff ID.');

  const existing = await one<{ id: number }>('SELECT id FROM users WHERE id = ?', [staffId]);
  if (!existing) throw new HttpError(404, 'User not found.');

  const body = await req.json().catch(() => ({}));
  const { name, phone, designation } = body;

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (name !== undefined) {
    if (!name.trim()) throw new HttpError(400, 'Name cannot be blank.');
    updates.push('name = ?');
    args.push(name.trim());
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    args.push(phone?.trim() || null);
  }
  if (designation !== undefined) {
    updates.push('designation = ?');
    args.push(designation?.trim() || null);
  }

  if (updates.length > 0) {
    args.push(staffId);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args);
  }

  return json({ ok: true });
});
