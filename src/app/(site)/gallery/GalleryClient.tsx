'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { SCHOOL_VIDEOS } from '@/content/videos';
import { GalleryItem, GALLERY_CATEGORIES, GalleryCategory } from '@/content/gallery';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface GalleryClientProps {
  items: GalleryItem[];
}

export function GalleryClient({ items }: GalleryClientProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const handlePrev = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
    }
  }, [lightboxIndex, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
    }
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext]);

  const activePhoto = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <>
      {/* Primary Tab Navigation: Photos vs Videos */}
      <div className={styles.tabBar} role="tablist" aria-label="Gallery media categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'photos'}
          className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photographs ({items.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'videos'}
          className={`${styles.tabBtn} ${activeTab === 'videos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Campus Videos ({SCHOOL_VIDEOS.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'photos' && (
        <>
          {/* Category Filter Chips */}
          <div className={styles.categoryBar} role="toolbar" aria-label="Filter photos by topic">
            {GALLERY_CATEGORIES.map((cat) => {
              const count = cat === 'All' ? items.length : items.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catChip} ${activeCategory === cat ? styles.activeCatChip : ''}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setLightboxIndex(null);
                  }}
                  aria-pressed={activeCategory === cat}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Photos Masonry Grid */}
          <section aria-label="Photo gallery" className={styles.masonry}>
            {filteredItems.map((item, idx) => (
              <div
                key={item.id || item.src}
                className={styles.masonryItem}
                onClick={() => setLightboxIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxIndex(idx);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View photo: ${item.title}`}
              >
                <div className={styles.thumbnailWrapper}>
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className={styles.thumbnail}
                  />
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardCategory}>{item.category}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'videos' && (
        <section aria-label="Video gallery" className={styles.videosGrid}>
          {SCHOOL_VIDEOS.map((video) => (
            <div key={video.id} className={styles.videoCard}>
              <div className={styles.iframeWrapper}>
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={styles.iframe}
                />
              </div>
              <div className={styles.videoMeta}>
                <h3 className={styles.videoTitle}>{video.title}</h3>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Lightbox Dialog */}
      {lightboxIndex !== null && activePhoto && (
        <Dialog
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          title={`Campus Photo ${lightboxIndex + 1} of ${filteredItems.length}`}
        >
          <div className={styles.lightboxBody}>
            <div className={styles.lightboxImageWrapper}>
              <Image
                src={activePhoto.src}
                alt={activePhoto.title}
                fill
                sizes="800px"
                className={styles.lightboxImage}
              />
            </div>
            <div className={styles.lightboxMeta}>
              <span className={styles.cardCategory}>{activePhoto.category}</span>
              <h4 className={styles.lightboxTitle}>{activePhoto.title}</h4>
              {activePhoto.description && (
                <p className={styles.lightboxDesc}>{activePhoto.description}</p>
              )}
            </div>
            <div className={styles.lightboxNav}>
              <Button variant="secondary" onClick={handlePrev} aria-label="Previous photo">
                &larr; Previous
              </Button>
              <span className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {filteredItems.length}
              </span>
              <Button variant="secondary" onClick={handleNext} aria-label="Next photo">
                Next &rarr;
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
