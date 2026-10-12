import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { revertPageToVersion } from '@/server/cms';

export const POST = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('cms.edit');
    if (!context?.params) throw new HttpError(400, 'Missing route parameters.');
    const { id } = await context.params;
    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) throw new HttpError(400, 'Invalid page ID.');

    const body = await req.json().catch(() => null);
    if (!body || !body.version_id) {
      throw new HttpError(400, 'version_id is required in JSON body.');
    }

    const versionId = parseInt(body.version_id, 10);
    const reverted = await revertPageToVersion(pageId, versionId, user.id);
    return json(reverted);
  }
);
