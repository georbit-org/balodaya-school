import { handle, json, HttpError } from '@/server/http';
import { requireRole } from '@/server/guard';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal', 'teacher');

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new HttpError(400, 'No file was uploaded.');
  }

  // Validate mime type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new HttpError(400, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new HttpError(400, 'File size exceeds maximum permitted limit of 5 MB.');
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${sanitized}`;
  const filePath = path.join(uploadDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  const publicUrl = `/uploads/hero/${filename}`;

  return json({
    success: true,
    url: publicUrl,
    filename,
  });
});
