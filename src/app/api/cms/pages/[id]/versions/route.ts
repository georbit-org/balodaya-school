import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { listPageVersions } from '@/server/cms';

export const GET = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    await requireAction('cms.edit');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    const versions = await listPageVersions(pageId);
    return json(versions);
  }
);
