import { requireAction } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { listMedia, saveUploadedFile } from '@/server/media';

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const folder = url.searchParams.get('folder') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const tag = url.searchParams.get('tag') || undefined;
  const visibility = url.searchParams.get('visibility') || undefined;
  const page = url.searchParams.has('page')
    ? parseInt(url.searchParams.get('page')!, 10)
    : 1;
  const limit = url.searchParams.has('limit')
    ? parseInt(url.searchParams.get('limit')!, 10)
    : 24;

  const result = await listMedia({
    folder,
    search,
    tag,
    visibility,
    page,
    limit,
  });

  return json(result);
});

export const POST = handle(async (req: Request) => {
  const user = await requireAction('media.manage');

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    throw new HttpError(400, 'Multipart form data is required.');
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    throw new HttpError(400, 'File is required.');
  }

  const altText = (formData.get('alt_text') as string | null) || '';
  const altTextNe = (formData.get('alt_text_ne') as string | null) || undefined;
  const caption = (formData.get('caption') as string | null) || undefined;
  const folder = (formData.get('folder') as string | null) || 'general';
  const tags = (formData.get('tags') as string | null) || undefined;
  const visibility = (formData.get('visibility') as 'public' | 'private' | null) || 'public';

  const focalXRaw = formData.get('focal_x');
  const focalYRaw = formData.get('focal_y');
  const focalX = focalXRaw ? parseFloat(focalXRaw as string) : 0.5;
  const focalY = focalYRaw ? parseFloat(focalYRaw as string) : 0.5;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const media = await saveUploadedFile(
    buffer,
    file.name,
    file.type || 'application/octet-stream',
    altText,
    {
      alt_text_ne: altTextNe,
      caption,
      folder,
      tags,
      focal_x: focalX,
      focal_y: focalY,
      visibility,
      uploaded_by: user.id,
    }
  );

  return json(media, 201);
});
