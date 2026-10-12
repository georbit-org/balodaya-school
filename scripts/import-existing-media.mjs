import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { query, run, one } from '../src/server/db.ts';

console.log('--- Importing Existing Assets into Balodaya Media Library ---');

const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images');
if (!fs.existsSync(imagesDir)) {
  console.log('No assets/images directory found.');
  process.exit(0);
}

// Helper to recursively find image files
function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const allImageFiles = getFilesRecursively(imagesDir);
console.log(`Found ${allImageFiles.length} image assets on disk.`);

let imported = 0;
let updated = 0;

for (const fullPath of allImageFiles) {
  const relPath = fullPath
    .replace(path.join(process.cwd(), 'public'), '')
    .replace(/\\/g, '/');

  const stat = fs.statSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const filename = path.basename(fullPath);

  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.webp') mime = 'image/webp';
  else if (ext === '.gif') mime = 'image/gif';
  else if (ext === '.avif') mime = 'image/avif';

  let width = null;
  let height = null;
  try {
    const meta = await sharp(fullPath).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } catch {
    // Continue if metadata cannot be read
  }

  // Derive folder and descriptive alt text
  let folder = 'general';
  let tag = 'campus';
  const parts = relPath.split('/');

  if (relPath.includes('/gallery/')) {
    folder = 'gallery';
    tag = 'events';
  } else if (relPath.includes('/leadership/')) {
    folder = 'leadership';
    tag = 'staff';
  } else if (relPath.includes('/council/')) {
    folder = 'council';
    tag = 'students';
  } else if (relPath.includes('/facilities/')) {
    folder = 'facilities';
    tag = 'infrastructure';
  } else if (relPath.includes('/houses/')) {
    folder = 'houses';
    tag = 'academics';
  } else if (relPath.includes('logo') || relPath.includes('banner')) {
    folder = 'branding';
    tag = 'identity';
  }

  // Generate human-friendly alt text from filename / path
  let altText = filename
    .replace(/^\d+[-_]?/, '') // remove numeric prefixes
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]+/g, ' ') // replace dashes/underscores with space
    .trim();

  if (altText.length < 3 || /^\d+$/.test(altText)) {
    altText = `Balodaya Secondary School ${folder} photograph`;
  } else {
    // Capitalize words
    altText = altText
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const existing = await one('SELECT id FROM media WHERE file_path = ?', [relPath]);

  if (!existing) {
    await run(
      `INSERT INTO media (
        file_path, original_name, mime, size_bytes, width, height,
        alt_text, caption, folder, tags, focal_x, focal_y, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.5, 0.5, 'public')`,
      [
        relPath,
        filename,
        mime,
        stat.size,
        width,
        height,
        altText,
        altText,
        folder,
        tag,
      ]
    );
    imported++;
  } else {
    updated++;
  }
}

console.log(`Media import completed: ${imported} imported, ${updated} already existing.`);

// Step 2: Map hero_slides to media_id where matching
try {
  const slides = await query('SELECT id, image FROM hero_slides WHERE media_id IS NULL');
  let linkedSlides = 0;
  for (const s of slides) {
    if (s.image) {
      const match = await one('SELECT id FROM media WHERE file_path = ?', [s.image]);
      if (match) {
        await run('UPDATE hero_slides SET media_id = ? WHERE id = ?', [match.id, s.id]);
        linkedSlides++;
      }
    }
  }
  if (linkedSlides > 0) {
    console.log(`Linked ${linkedSlides} hero slides to media library IDs.`);
  }
} catch (e) {
  console.log('Hero slides linking note:', e.message);
}

const totalMedia = await one('SELECT count(*) as cnt FROM media WHERE deleted_at IS NULL');
console.log(`Total active items in media library: ${totalMedia?.cnt ?? 0}`);
process.exit(0);
