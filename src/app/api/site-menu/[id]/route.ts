import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { run, one } from '@/server/db';
import { audit } from '@/server/audit';
import type { SiteMenuItem } from '../route';

export const PUT = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('menu.manage');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const menuId = parseInt(id, 10);
    if (isNaN(menuId)) throw new HttpError(400, 'Invalid menu ID.');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'JSON body is required.');
    }

    const existing = await one<SiteMenuItem>('SELECT * FROM site_menu WHERE id = ?', [menuId]);
    if (!existing) throw new HttpError(404, 'Menu item not found.');

    await run(
      `UPDATE site_menu SET
        label = ?, label_ne = ?, href = ?, sort_order = ?,
        visible = ?, open_new_tab = ?
      WHERE id = ?`,
      [
        body.label !== undefined ? body.label.trim() : existing.label,
        body.label_ne !== undefined ? body.label_ne?.trim() || null : existing.label_ne,
        body.href !== undefined ? body.href.trim() : existing.href,
        body.sort_order !== undefined ? Number(body.sort_order) : existing.sort_order,
        body.visible !== undefined ? (body.visible ? 1 : 0) : existing.visible,
        body.open_new_tab !== undefined ? (body.open_new_tab ? 1 : 0) : existing.open_new_tab,
        menuId,
      ]
    );

    await audit(user.id, 'update', 'site_menu', menuId, body);
    return json({ message: 'Menu item updated successfully.' });
  }
);

export const DELETE = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('menu.manage');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const menuId = parseInt(id, 10);
    if (isNaN(menuId)) throw new HttpError(400, 'Invalid menu ID.');

    await run('DELETE FROM site_menu WHERE id = ?', [menuId]);
    await audit(user.id, 'delete', 'site_menu', menuId);

    return json({ message: 'Menu item deleted successfully.' });
  }
);
