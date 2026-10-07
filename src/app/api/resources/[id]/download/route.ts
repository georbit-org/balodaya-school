import fs from 'fs';
import path from 'path';
import { readSession } from '@/server/session';
import { one } from '@/server/db';
import { handle, HttpError } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const resId = parseInt(id, 10);
  if (isNaN(resId)) throw new HttpError(400, 'Invalid resource ID.');

  const resource = await one<{
    id: number;
    title: string;
    file_path: string;
    published: number;
  }>('SELECT id, title, file_path, published FROM resources WHERE id = ?', [resId]);

  if (!resource) {
    throw new HttpError(404, 'Resource not found.');
  }

  // Unpublished guard: only authenticated staff can access unpublished resources
  if (resource.published === 0) {
    const session = await readSession();
    const isStaff = session && (session.role === 'admin' || session.role === 'principal' || session.role === 'teacher');
    if (!isStaff) {
      throw new HttpError(404, 'Resource not found or has been unpublished.');
    }
  }

  // Resolve file on disk
  const relPath = resource.file_path.replace(/^\//, '').replace(/^public\//, '');
  let fullPath = path.join(process.cwd(), 'public', relPath);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(process.cwd(), 'data', relPath);
    if (!fs.existsSync(fullPath)) {
      throw new HttpError(404, 'Resource file not found on disk.');
    }
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.pdf') contentType = 'application/pdf';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const filename = path.basename(fullPath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
});
