import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { query, run } from '@/server/db';
import { audit } from '@/server/audit';

export interface SiteMenuItem {
  id: number;
  zone: 'header' | 'more' | 'footer1' | 'footer2' | 'mobile';
  label: string;
  label_ne: string | null;
  href: string;
  page_id: number | null;
  sort_order: number;
  visible: number;
  open_new_tab: number;
}

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const zone = url.searchParams.get('zone');

  if (zone) {
    const items = await query<SiteMenuItem>(
      'SELECT * FROM site_menu WHERE zone = ? ORDER BY sort_order ASC, id ASC',
      [zone]
    );
    return json(items);
  }

  const items = await query<SiteMenuItem>(
    'SELECT * FROM site_menu ORDER BY zone ASC, sort_order ASC, id ASC'
  );
  return json(items);
});

export const POST = handle(async (req: Request) => {
  const user = await requireAction('menu.manage');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required.');
  }

  if (!body.label || !body.href || !body.zone) {
    throw new HttpError(422, 'Label, href, and zone are required.');
  }

  const res = await run(
    `INSERT INTO site_menu (
      zone, label, label_ne, href, page_id, sort_order, visible, open_new_tab
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.zone,
      body.label.trim(),
      body.label_ne?.trim() || null,
      body.href.trim(),
      body.page_id || null,
      body.sort_order || 0,
      body.visible !== undefined ? (body.visible ? 1 : 0) : 1,
      body.open_new_tab ? 1 : 0,
    ]
  );

  const newId = Number(res.lastInsertRowid);
  await audit(user.id, 'create', 'site_menu', newId, { label: body.label, zone: body.zone });

  return json({ id: newId, message: 'Menu item created successfully.' }, 201);
});
