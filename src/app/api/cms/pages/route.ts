import { requireAction, requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { listPages, savePage } from '@/server/cms';

export const GET = handle(async () => {
  let includeDrafts = false;
  try {
    const user = await requireUser();
    if (user.role === 'admin' || user.role === 'principal') {
      includeDrafts = true;
    }
  } catch {
    includeDrafts = false;
  }

  const pages = await listPages({ includeDrafts });
  return json(pages);
});

export const POST = handle(async (req: Request) => {
  const user = await requireAction('cms.edit');
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required.');
  }

  if (!body.title || !body.title.trim()) {
    throw new HttpError(422, 'Page title is required.');
  }

  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();

  const saved = await savePage(
    null,
    {
      slug,
      title: body.title,
      title_ne: body.title_ne,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      seo_image_media_id: body.seo_image_media_id,
      status: body.status || 'draft',
      show_in_nav: body.show_in_nav ? 1 : 0,
      nav_label: body.nav_label,
      nav_label_ne: body.nav_label_ne,
      nav_order: body.nav_order || 100,
      is_system: 0,
    },
    body.sections || [],
    user.id
  );

  return json(saved, 201);
});
