import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { publishPage } from '@/server/cms';

export const POST = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('cms.publish');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    const body = await req.json().catch(() => ({}));
    const note = body?.note as string | undefined;

    const published = await publishPage(pageId, user.id, note);
    return json(published);
  }
);
