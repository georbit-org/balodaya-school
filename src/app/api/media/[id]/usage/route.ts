import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { getMediaUsage, getMedia } from '@/server/media';

export const GET = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    await requireUser();
    if (!context?.params) throw new HttpError(400, 'Route parameters missing.');
    const { id } = await context.params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) throw new HttpError(400, 'Invalid media ID.');

    const media = await getMedia(mediaId);
    if (!media) throw new HttpError(404, 'Media item not found.');

    const usage = await getMediaUsage(mediaId);
    return json({ media_id: mediaId, count: usage.length, usage });
  }
);
