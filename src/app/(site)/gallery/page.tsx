import React from 'react';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { SCHOOL_GALLERY_PHOTOS, GalleryItem } from '@/content/gallery';
import { GalleryClient } from './GalleryClient';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Photo & Video Gallery | Balodaya Secondary English Boarding School',
  description: `Authentic photographic records documenting morning assemblies, athletics championships, cultural celebrations, science exhibits, faculty, and student life in Bheerkot-06, Syangja.`,
};

export default function GalleryPage() {
  const galleryDir = path.join(process.cwd(), 'public', 'assets', 'images', 'gallery', '1', 'original');
  const items: GalleryItem[] = [...SCHOOL_GALLERY_PHOTOS];

  try {
    if (fs.existsSync(galleryDir)) {
      const files = fs
        .readdirSync(galleryDir)
        .filter((file) => /\.(jpg|jpeg|png|webp|JPG|PNG|JPEG)$/i.test(file));

      const existingSrcs = new Set(items.map((p) => p.src.toLowerCase()));

      for (const f of files) {
        const src = `/assets/images/gallery/1/original/${f}`;
        if (!existingSrcs.has(src.toLowerCase())) {
          const cleanName = f
            .replace(/\.[^/.]+$/, '')
            .replace(/^\d+[-_]?/, '')
            .replace(/[-_]/g, ' ');

          items.push({
            id: `orig-${f}`,
            src,
            title: cleanName.length > 3 ? cleanName : `Campus Photograph ${f}`,
            category: 'Assemblies & Campus Life',
            description: 'Photographic archive record from Balodaya Secondary English Boarding School campus.',
          });
        }
      }
    }
  } catch {
    // Keep curated items
  }

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>School Photographic Gallery &amp; Archives</h1>
        <p className={styles.subtitle}>
          Visual chronicles of our students, academic ceremonies, athletic meets, cultural presentations, and daily campus life in Sundar Bazar, Bheerkot-06, Syangja.
        </p>
      </header>

      <GalleryClient items={items} />
    </div>
  );
}
