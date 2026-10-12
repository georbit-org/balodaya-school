import { requireAction, requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { getPageById, savePage, deletePage } from '@/server/cms';

export const GET = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    const page = await getPageById(pageId);
    if (!page) throw new HttpError(404, 'CMS page not found.');

    if (page.status !== 'published') {
      await requireUser();
    }

    return json(page);
  }
);

export const PUT = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('cms.edit');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'JSON body is required.');
    }

    const saved = await savePage(
      pageId,
      {
        slug: body.slug,
        title: body.title,
        title_ne: body.title_ne,
        seo_title: body.seo_title,
        seo_description: body.seo_description,
        seo_image_media_id: body.seo_image_media_id,
        status: body.status,
        show_in_nav: body.show_in_nav !== undefined ? (body.show_in_nav ? 1 : 0) : undefined,
        nav_label: body.nav_label,
        nav_label_ne: body.nav_label_ne,
        nav_order: body.nav_order,
      },
      body.sections || [],
      user.id
    );

    return json(saved);
  }
);

export const DELETE = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('cms.edit');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    await deletePage(pageId, user.id);
    return json({ message: 'Page deleted successfully.', id: pageId });
  }
);
