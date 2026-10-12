import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { replaceMediaFile } from '@/server/media';

export const POST = handle(
  async (req: Request, context?: { params: Promise<{ id: string }> }) => {
    const user = await requireAction('media.manage');
    if (!context?.params) throw new HttpError(400, 'Route parameters missing.');
    const { id } = await context.params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) throw new HttpError(400, 'Invalid media ID.');

    const formData = await req.formData().catch(() => null);
    if (!formData) throw new HttpError(400, 'Multipart form data is required.');

    const file = formData.get('file') as File | null;
    if (!file) throw new HttpError(400, 'New file is required for replacement.');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const updated = await replaceMediaFile(
      mediaId,
      buffer,
      file.name,
      file.type || 'application/octet-stream',
      user.id
    );

    return json(updated);
  }
);
