import { handle, json, HttpError } from '@/server/http';
import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';

export const dynamic = 'force-dynamic';

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal', 'teacher');
  const { id } = await params;

  const slide = await one<{
    id: string;
    badge: string;
    title: string;
    subtitle: string;
    image: string;
    primary_cta_text: string;
    primary_cta_link: string;
    secondary_cta_text: string;
    secondary_cta_link: string;
    display_order: number;
    is_active: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM hero_slides WHERE id = ?', [id]);

  if (!slide) {
    throw new HttpError(404, 'Slide not found.');
  }

  return json({
    success: true,
    slide: {
      ...slide,
      primaryCtaText: slide.primary_cta_text,
      primaryCtaLink: slide.primary_cta_link,
      secondaryCtaText: slide.secondary_cta_text,
      secondaryCtaLink: slide.secondary_cta_link,
      order: slide.display_order,
      active: Boolean(slide.is_active),
    },
  });
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole('admin', 'principal', 'teacher');
  const { id } = await params;

  const existing = await one<{ id: string; title: string }>('SELECT id, title FROM hero_slides WHERE id = ?', [id]);
  if (!existing) {
    throw new HttpError(404, 'Slide not found.');
  }

  const body = await req.json();

  const updates: string[] = [];
  const args: any[] = [];

  if (body.badge !== undefined) {
    updates.push('badge = ?');
    args.push(String(body.badge).trim());
  }
  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) throw new HttpError(400, 'Slide title cannot be empty.');
    updates.push('title = ?');
    args.push(t);
  }
  if (body.subtitle !== undefined) {
    updates.push('subtitle = ?');
    args.push(String(body.subtitle).trim());
  }
  if (body.image !== undefined) {
    const img = String(body.image).trim();
    if (!img) throw new HttpError(400, 'Slide image path cannot be empty.');
    updates.push('image = ?');
    args.push(img);
  }
  if (body.primary_cta_text !== undefined || body.primaryCtaText !== undefined) {
    updates.push('primary_cta_text = ?');
    args.push(String(body.primary_cta_text ?? body.primaryCtaText).trim());
  }
  if (body.primary_cta_link !== undefined || body.primaryCtaLink !== undefined) {
    updates.push('primary_cta_link = ?');
    args.push(String(body.primary_cta_link ?? body.primaryCtaLink).trim());
  }
  if (body.secondary_cta_text !== undefined || body.secondaryCtaText !== undefined) {
    updates.push('secondary_cta_text = ?');
    args.push(String(body.secondary_cta_text ?? body.secondaryCtaText).trim());
  }
  if (body.secondary_cta_link !== undefined || body.secondaryCtaLink !== undefined) {
    updates.push('secondary_cta_link = ?');
    args.push(String(body.secondary_cta_link ?? body.secondaryCtaLink).trim());
  }
  if (body.display_order !== undefined || body.order !== undefined) {
    updates.push('display_order = ?');
    args.push(Number(body.display_order ?? body.order));
  }
  if (body.is_active !== undefined || body.active !== undefined) {
    const val = body.is_active !== undefined ? Number(body.is_active) : body.active ? 1 : 0;
    updates.push('is_active = ?');
    args.push(val);
  }

  if (updates.length === 0) {
    throw new HttpError(400, 'No fields provided for update.');
  }

  updates.push("updated_at = datetime('now')");
  args.push(id);

  await run(
    `UPDATE hero_slides SET ${updates.join(', ')} WHERE id = ?`,
    args
  );

  // Audit log
  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'update_hero_slide', 'hero_slides', NULL, ?)`,
    [user.id, `Updated slide "${existing.title}" (${id})`]
  );

  const updated = await one('SELECT * FROM hero_slides WHERE id = ?', [id]);
  return json({ success: true, slide: updated });
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole('admin', 'principal', 'teacher');
  const { id } = await params;

  const existing = await one<{ id: string; title: string }>('SELECT id, title FROM hero_slides WHERE id = ?', [id]);
  if (!existing) {
    throw new HttpError(404, 'Slide not found.');
  }

  await run('DELETE FROM hero_slides WHERE id = ?', [id]);

  // Audit log
  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'delete_hero_slide', 'hero_slides', NULL, ?)`,
    [user.id, `Deleted slide "${existing.title}" (${id})`]
  );

  return json({ success: true, message: `Slide "${existing.title}" deleted.` });
});
