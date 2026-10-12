import fs from 'node:fs';
import path from 'node:path';
import { requireUser } from '@/server/guard';
import { getMedia } from '@/server/media';

export async function GET(
  _req: Request,
  context?: { params: Promise<{ id: string; size: string }> }
) {
  if (!context?.params) {
    return new Response(JSON.stringify({ error: 'Route parameters missing.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, size } = await context.params;
  const mediaId = parseInt(id, 10);
  if (isNaN(mediaId)) {
    return new Response(JSON.stringify({ error: 'Invalid media ID.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const media = await getMedia(mediaId);
  if (!media) {
    return new Response(JSON.stringify({ error: 'Media not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (media.visibility === 'private') {
    try {
      await requireUser();
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const originalDiskPath = path.join(
    process.cwd(),
    'public',
    media.file_path.replace(/^\//, '')
  );

  let targetDiskPath = originalDiskPath;
  let mimeType = media.mime;

  if (['480', '960', '1600'].includes(size) && media.mime.startsWith('image/')) {
    const ext = path.extname(originalDiskPath);
    const candidatePath = originalDiskPath.replace(ext, `-${size}.webp`);
    if (fs.existsSync(candidatePath)) {
      targetDiskPath = candidatePath;
      mimeType = 'image/webp';
    }
  }

  if (!fs.existsSync(targetDiskPath)) {
    if (fs.existsSync(originalDiskPath)) {
      targetDiskPath = originalDiskPath;
    } else {
      return new Response(JSON.stringify({ error: 'File missing.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const buffer = fs.readFileSync(targetDiskPath);
  const headers = new Headers();
  headers.set('Content-Type', mimeType);
  headers.set('Content-Length', buffer.length.toString());
  headers.set(
    'Cache-Control',
    media.visibility === 'public'
      ? 'public, max-age=31536000, immutable'
      : 'private, no-cache, no-store'
  );

  return new Response(buffer, { status: 200, headers });
}
