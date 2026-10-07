import { handle, json, HttpError } from '@/server/http';
import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  await requireRole('admin', 'principal', 'teacher');

  const slides = await query<{
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
  }>(`SELECT * FROM hero_slides ORDER BY display_order ASC, id ASC`);

  return json({
    success: true,
    slides: slides.map((s) => ({
      ...s,
      primaryCtaText: s.primary_cta_text,
      primaryCtaLink: s.primary_cta_link,
      secondaryCtaText: s.secondary_cta_text,
      secondaryCtaLink: s.secondary_cta_link,
      order: s.display_order,
      active: Boolean(s.is_active),
    })),
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireRole('admin', 'principal', 'teacher');
  const body = await req.json();

  const title = (body.title || '').trim();
  const image = (body.image || '').trim();
  if (!title) {
    throw new HttpError(400, 'Slide title is required.');
  }
  if (!image) {
    throw new HttpError(400, 'Slide image path or URL is required.');
  }

  const badge = (body.badge || 'Balodaya Campus Highlight').trim();
  const subtitle = (body.subtitle || '').trim();
  const primaryCtaText = (body.primary_cta_text || body.primaryCtaText || 'Explore').trim();
  const primaryCtaLink = (body.primary_cta_link || body.primaryCtaLink || '/about').trim();
  const secondaryCtaText = (body.secondary_cta_text || body.secondaryCtaText || '').trim();
  const secondaryCtaLink = (body.secondary_cta_link || body.secondaryCtaLink || '').trim();
  const displayOrder = Number(body.display_order ?? body.order ?? 0);
  const isActive = body.is_active === 0 || body.active === false ? 0 : 1;

  const id = (body.id || `slide-${Date.now()}`).trim();

  // Check if ID already exists
  const existing = await one<{ id: string }>('SELECT id FROM hero_slides WHERE id = ?', [id]);
  if (existing) {
    throw new HttpError(409, `A slide with ID "${id}" already exists.`);
  }

  await run(
    `INSERT INTO hero_slides (
      id, badge, title, subtitle, image, 
      primary_cta_text, primary_cta_link, 
      secondary_cta_text, secondary_cta_link, 
      display_order, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      id,
      badge,
      title,
      subtitle,
      image,
      primaryCtaText,
      primaryCtaLink,
      secondaryCtaText,
      secondaryCtaLink,
      displayOrder,
      isActive,
    ]
  );

  // Log to audit_log
  await run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
     VALUES (?, 'create_hero_slide', 'hero_slides', NULL, ?)`,
    [user.id, `Created slide "${title}" (${id})`]
  );

  const created = await one(
    'SELECT * FROM hero_slides WHERE id = ?',
    [id]
  );

  return json({ success: true, slide: created }, 201);
});
