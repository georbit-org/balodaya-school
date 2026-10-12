import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { query, one, run } from '@/server/db';
import { HttpError } from '@/server/http';
import { audit } from '@/server/audit';

export interface MediaRecord {
  id: number;
  file_path: string;
  original_name: string | null;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  alt_text_ne: string | null;
  caption: string | null;
  folder: string;
  tags: string | null;
  focal_x: number;
  focal_y: number;
  visibility: 'public' | 'private';
  uploaded_by: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface MediaUsageRef {
  entity: string;
  title: string;
  url: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]);

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15 MB

function getUploadDirs(): { diskUploadsDir: string; relFolder: string } {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const diskUploadsDir = path.join(process.cwd(), 'public', 'uploads', yearMonth);
  if (!fs.existsSync(diskUploadsDir)) {
    fs.mkdirSync(diskUploadsDir, { recursive: true });
  }
  return { diskUploadsDir, relFolder: yearMonth };
}

function getExtension(mime: string, originalName?: string | null): string {
  if (originalName) {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    if (ext && ext.length <= 5) return ext;
  }
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/gif':
      return 'gif';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string | null,
  mime: string,
  altText: string,
  options: {
    alt_text_ne?: string | null;
    caption?: string | null;
    folder?: string;
    tags?: string | null;
    focal_x?: number;
    focal_y?: number;
    visibility?: 'public' | 'private';
    uploaded_by?: number | null;
  } = {}
): Promise<MediaRecord> {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new HttpError(
      400,
      `Unsupported file type "${mime}". Allowed: JPEG, PNG, WebP, AVIF, GIF, PDF.`
    );
  }

  const isImage = mime.startsWith('image/');
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
  if (buffer.length > maxSize) {
    throw new HttpError(
      400,
      `File exceeds maximum limit (${isImage ? '8 MB' : '15 MB'}).`
    );
  }

  if (isImage && (!altText || !altText.trim())) {
    throw new HttpError(
      422,
      'Alt text is required for all images to ensure accessibility (WCAG AA).'
    );
  }

  const { diskUploadsDir, relFolder } = getUploadDirs();
  const idPrefix = randomUUID();
  const ext = getExtension(mime, originalName);
  const filename = `${idPrefix}.${ext}`;
  const diskPath = path.join(diskUploadsDir, filename);

  fs.writeFileSync(diskPath, buffer);

  let width: number | null = null;
  let height: number | null = null;

  if (isImage) {
    try {
      const img = sharp(buffer);
      const meta = await img.metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;

      // Generate 3 responsive webp sizes: 480, 960, 1600
      const sizes = [480, 960, 1600];
      await Promise.all(
        sizes.map(async (size) => {
          const outName = `${idPrefix}-${size}.webp`;
          const outPath = path.join(diskUploadsDir, outName);
          await sharp(buffer)
            .resize({ width: size, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(outPath);
        })
      );
    } catch {
      // In case image metadata read fails, continue with original
    }
  }

  const publicFilePath = `/uploads/${relFolder}/${filename}`;
  const folder = options.folder?.trim() || 'general';
  const focalX = options.focal_x ?? 0.5;
  const focalY = options.focal_y ?? 0.5;
  const visibility = options.visibility ?? 'public';

  await run(
    `INSERT INTO media (
      file_path, original_name, mime, size_bytes, width, height,
      alt_text, alt_text_ne, caption, folder, tags,
      focal_x, focal_y, visibility, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      publicFilePath,
      originalName,
      mime,
      buffer.length,
      width,
      height,
      altText.trim(),
      options.alt_text_ne?.trim() || null,
      options.caption?.trim() || null,
      folder,
      options.tags?.trim() || null,
      focalX,
      focalY,
      visibility,
      options.uploaded_by ?? null,
    ]
  );

  const row = await one<MediaRecord>(
    'SELECT * FROM media WHERE file_path = ? ORDER BY id DESC LIMIT 1',
    [publicFilePath]
  );

  if (!row) {
    throw new HttpError(500, 'Failed to save media record.');
  }

  if (options.uploaded_by) {
    await audit(options.uploaded_by, 'create', 'media', row.id, {
      name: originalName,
      file_path: publicFilePath,
      size_bytes: buffer.length,
    });
  }

  return row;
}

export async function getMedia(id: number): Promise<MediaRecord | null> {
  const row = await one<MediaRecord>(
    'SELECT * FROM media WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return row ?? null;
}

export async function listMedia(filters: {
  folder?: string;
  search?: string;
  tag?: string;
  visibility?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: MediaRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const args: Array<string | number> = [];

  if (filters.folder && filters.folder !== 'all') {
    conditions.push('folder = ?');
    args.push(filters.folder);
  }

  if (filters.visibility) {
    conditions.push('visibility = ?');
    args.push(filters.visibility);
  }

  if (filters.tag) {
    conditions.push('tags LIKE ?');
    args.push(`%${filters.tag}%`);
  }

  if (filters.search) {
    conditions.push('(alt_text LIKE ? OR original_name LIKE ? OR caption LIKE ?)');
    const term = `%${filters.search}%`;
    args.push(term, term, term);
  }

  const whereClause = conditions.join(' AND ');

  const countRow = await one<{ count: number }>(
    `SELECT COUNT(*) as count FROM media WHERE ${whereClause}`,
    args
  );
  const total = countRow?.count ?? 0;

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 24));
  const offset = (page - 1) * limit;

  const items = await query<MediaRecord>(
    `SELECT * FROM media WHERE ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  );

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateMedia(
  id: number,
  updates: {
    alt_text?: string;
    alt_text_ne?: string | null;
    caption?: string | null;
    folder?: string;
    tags?: string | null;
    focal_x?: number;
    focal_y?: number;
    visibility?: 'public' | 'private';
  },
  userId: number
): Promise<MediaRecord> {
  const existing = await getMedia(id);
  if (!existing) {
    throw new HttpError(404, 'Media item not found.');
  }

  if (
    existing.mime.startsWith('image/') &&
    updates.alt_text !== undefined &&
    !updates.alt_text.trim()
  ) {
    throw new HttpError(422, 'Alt text cannot be empty for an image.');
  }

  const fields: string[] = [];
  const args: Array<string | number | null> = [];

  if (updates.alt_text !== undefined) {
    fields.push('alt_text = ?');
    args.push(updates.alt_text.trim());
  }
  if (updates.alt_text_ne !== undefined) {
    fields.push('alt_text_ne = ?');
    args.push(updates.alt_text_ne?.trim() || null);
  }
  if (updates.caption !== undefined) {
    fields.push('caption = ?');
    args.push(updates.caption?.trim() || null);
  }
  if (updates.folder !== undefined) {
    fields.push('folder = ?');
    args.push(updates.folder.trim() || 'general');
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    args.push(updates.tags?.trim() || null);
  }
  if (updates.focal_x !== undefined) {
    fields.push('focal_x = ?');
    args.push(updates.focal_x);
  }
  if (updates.focal_y !== undefined) {
    fields.push('focal_y = ?');
    args.push(updates.focal_y);
  }
  if (updates.visibility !== undefined) {
    fields.push('visibility = ?');
    args.push(updates.visibility);
  }

  if (fields.length > 0) {
    args.push(id);
    await run(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`, args);
  }

  await audit(userId, 'update', 'media', id, updates);

  const updated = await getMedia(id);
  if (!updated) throw new HttpError(500, 'Failed to retrieve updated media.');
  return updated;
}

export async function replaceMediaFile(
  id: number,
  buffer: Buffer,
  originalName: string | null,
  mime: string,
  userId: number
): Promise<MediaRecord> {
  const existing = await getMedia(id);
  if (!existing) {
    throw new HttpError(404, 'Media item not found.');
  }

  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new HttpError(400, `Unsupported file type "${mime}".`);
  }

  const { diskUploadsDir, relFolder } = getUploadDirs();
  const idPrefix = randomUUID();
  const ext = getExtension(mime, originalName);
  const filename = `${idPrefix}.${ext}`;
  const diskPath = path.join(diskUploadsDir, filename);

  fs.writeFileSync(diskPath, buffer);

  let width: number | null = null;
  let height: number | null = null;

  if (mime.startsWith('image/')) {
    try {
      const img = sharp(buffer);
      const meta = await img.metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;

      const sizes = [480, 960, 1600];
      await Promise.all(
        sizes.map(async (size) => {
          const outName = `${idPrefix}-${size}.webp`;
          const outPath = path.join(diskUploadsDir, outName);
          await sharp(buffer)
            .resize({ width: size, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(outPath);
        })
      );
    } catch {
      // Continue with original
    }
  }

  const newPublicPath = `/uploads/${relFolder}/${filename}`;

  await run(
    `UPDATE media SET
      file_path = ?,
      original_name = ?,
      mime = ?,
      size_bytes = ?,
      width = ?,
      height = ?
    WHERE id = ?`,
    [newPublicPath, originalName, mime, buffer.length, width, height, id]
  );

  await audit(userId, 'replace_file', 'media', id, {
    old_file_path: existing.file_path,
    new_file_path: newPublicPath,
    size_bytes: buffer.length,
  });

  const updated = await getMedia(id);
  if (!updated) throw new HttpError(500, 'Failed to fetch updated media.');
  return updated;
}

export async function getMediaUsage(id: number): Promise<MediaUsageRef[]> {
  const media = await getMedia(id);
  if (!media) return [];

  const refs: MediaUsageRef[] = [];
  const idStr = String(id);
  const pathStr = media.file_path;

  // 1. Hero slides
  try {
    const slides = await query<{ id: string; title: string }>(
      'SELECT id, title FROM hero_slides WHERE media_id = ? OR image LIKE ?',
      [id, `%${pathStr}%`]
    );
    for (const s of slides) {
      refs.push({
        entity: 'Hero Slide',
        title: s.title || `Slide #${s.id}`,
        url: '/app/hero-slides',
      });
    }
  } catch {
    // Column might not exist in old runs
  }

  // 2. CMS sections
  try {
    const sections = await query<{ id: number; page_id: number; type: string; title?: string }>(
      `SELECT s.id, s.page_id, s.type, p.title
       FROM cms_sections s
       JOIN cms_pages p ON p.id = s.page_id
       WHERE s.data LIKE ? OR s.data LIKE ?`,
      [`%"media_id":${idStr}%`, `%${pathStr}%`]
    );
    for (const sec of sections) {
      refs.push({
        entity: 'CMS Section',
        title: `${sec.title || 'Page'} (${sec.type})`,
        url: `/app/site/pages/${sec.page_id}`,
      });
    }
  } catch {
    // CMS tables might be empty
  }

  // 3. CMS pages SEO
  try {
    const pages = await query<{ id: number; title: string }>(
      'SELECT id, title FROM cms_pages WHERE seo_image_media_id = ?',
      [id]
    );
    for (const p of pages) {
      refs.push({
        entity: 'Page SEO Image',
        title: p.title,
        url: `/app/site/pages/${p.id}`,
      });
    }
  } catch {
    // Table empty
  }

  // 4. School Settings
  try {
    const settings = await query<{ key: string; value: string }>(
      'SELECT key, value FROM school_settings WHERE value LIKE ? OR value = ?',
      [`%${pathStr}%`, idStr]
    );
    for (const st of settings) {
      refs.push({
        entity: 'Site Setting',
        title: st.key,
        url: '/app/settings',
      });
    }
  } catch {
    // ignore
  }

  return refs;
}

export async function deleteMedia(
  id: number,
  userId: number,
  force = false
): Promise<void> {
  const existing = await getMedia(id);
  if (!existing) {
    throw new HttpError(404, 'Media item not found.');
  }

  const usage = await getMediaUsage(id);
  if (usage.length > 0 && !force) {
    throw new HttpError(
      409,
      `Media is currently in use across ${usage.length} place(s). Please remove or replace references before deleting.`,
      { usage: `${usage.length} active reference(s)` }
    );
  }

  await run("UPDATE media SET deleted_at = datetime('now') WHERE id = ?", [id]);
  await audit(userId, 'delete', 'media', id, {
    file_path: existing.file_path,
    force,
  });
}
