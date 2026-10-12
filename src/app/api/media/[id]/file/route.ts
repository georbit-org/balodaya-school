import fs from 'node:fs';
import path from 'node:path';
import { requireUser } from '@/server/guard';
import { HttpError } from '@/server/http';
import { getMedia } from '@/server/media';

export async function GET(
  _req: Request,
  context?: { params: Promise<{ id: string }> }
) {
  if (!context?.params) {
    return new Response(JSON.stringify({ error: 'Route parameters missing.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await context.params;
  const mediaId = parseInt(id, 10);
  if (isNaN(mediaId)) {
    return new Response(JSON.stringify({ error: 'Invalid media ID.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const media = await getMedia(mediaId);
  if (!media) {
    return new Response(JSON.stringify({ error: 'Media item not found.' }), {
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

  // Resolve disk path
  const diskPath = path.join(
    process.cwd(),
    'public',
    media.file_path.replace(/^\//, '')
  );

  if (!fs.existsSync(diskPath)) {
    return new Response(JSON.stringify({ error: 'File on disk missing.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fileBuffer = fs.readFileSync(diskPath);
  const headers = new Headers();
  headers.set('Content-Type', media.mime);
  headers.set('Content-Length', fileBuffer.length.toString());

  if (media.visibility === 'public') {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }

  if (media.mime === 'application/pdf') {
    const filename = media.original_name || `document-${media.id}.pdf`;
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
  }

  return new Response(fileBuffer, {
    status: 200,
    headers,
  });
}
