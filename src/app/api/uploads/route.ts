import fs from 'fs';
import path from 'path';
import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) throw new HttpError(400, 'Multipart form data is required.');

  const file = formData.get('file') as File | null;
  if (!file) throw new HttpError(400, 'File is required.');

  // Validate file size (max 25MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new HttpError(400, 'File size exceeds maximum 25 MB limit.');
  }

  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create safe filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${cleanName}`;
  const diskPath = path.join(uploadsDir, uniqueName);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(diskPath, Buffer.from(arrayBuffer));

  return json({
    file_path: `data/uploads/${uniqueName}`,
    file_name: file.name,
    size: file.size,
  }, 201);
});
