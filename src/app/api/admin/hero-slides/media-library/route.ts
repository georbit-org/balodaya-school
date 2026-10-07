import { handle, json } from '@/server/http';
import { requireRole } from '@/server/guard';
import { SCHOOL_GALLERY_PHOTOS } from '@/content/gallery';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  await requireRole('admin', 'principal', 'teacher');

  const photos = [...SCHOOL_GALLERY_PHOTOS];

  // Also include any user-uploaded hero images if directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
  if (fs.existsSync(uploadDir)) {
    try {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
          photos.unshift({
            id: `upload-${file}`,
            src: `/uploads/hero/${file}`,
            title: `Uploaded: ${file.replace(/^[0-9]+-/, '')}`,
            category: 'Assemblies & Campus Life',
            description: 'Custom uploaded school photograph',
          });
        }
      }
    } catch {
      // Ignore reading errors on upload folder
    }
  }

  return json({ success: true, photos });
});
