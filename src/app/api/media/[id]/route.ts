import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { getMedia, updateMedia, deleteMedia } from '@/server/media';

export const GET = handle(
  async (_req: Request, context?: { params: Promise<{ id: string }> }) => {
    if (!context?.params) throw new HttpError(400, 'Route parameters missing.');
    const { id } = await context.params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) throw new HttpError(400, 'Invalid media ID.');

    const media = await getMedia(mediaId);
    if (!media) throw new HttpError(404, 'Media item not found.');

    return json(media);
  }
);

export const PATCH = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('media.manage');
    if (!context?.params) throw new HttpError(400, 'Route parameters missing.');
    const { id } = await context.params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) throw new HttpError(400, 'Invalid media ID.');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'JSON body is required.');
    }

    const updated = await updateMedia(
      mediaId,
      {
        alt_text: body.alt_text,
        alt_text_ne: body.alt_text_ne,
        caption: body.caption,
        folder: body.folder,
        tags: body.tags,
        focal_x: body.focal_x !== undefined ? Number(body.focal_x) : undefined,
        focal_y: body.focal_y !== undefined ? Number(body.focal_y) : undefined,
        visibility: body.visibility,
      },
      user.id
    );

    return json(updated);
  }
);

export const DELETE = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('media.manage');
    if (!context?.params) throw new HttpError(400, 'Route parameters missing.');
    const { id } = await context.params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) throw new HttpError(400, 'Invalid media ID.');

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    await deleteMedia(mediaId, user.id, force);

    return json({ message: 'Media item deleted successfully.', id: mediaId });
  }
);
