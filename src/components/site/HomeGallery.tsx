'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DiagonalMarqueeCarousel from '@/components/ui/DiagonalMarqueeCarousel';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import pageStyles from '@/app/(site)/page.module.css';
import styles from './HomeGallery.module.css';

export interface HomeGalleryImage {
  src: string;
  alt: string;
}

interface HomeGalleryProps {
  images: HomeGalleryImage[];
}

export function HomeGallery({ images }: HomeGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activePhoto = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <section className={pageStyles.homeGallerySection} aria-labelledby="photo-strip-heading">
        <div className={pageStyles.homeGalleryHeader}>
          <h2 id="photo-strip-heading" className={pageStyles.sectionHeading}>
            Campus Activities
          </h2>
          <Link href="/gallery" className={pageStyles.heroSecondaryLink}>
            See the gallery &rarr;
          </Link>
        </div>
        <DiagonalMarqueeCarousel
          cards={images.map((image, index) => ({
            id: index,
            url: image.src,
            title: image.alt,
          }))}
          baseSpeed={125}
          onCardClick={(card) => setLightboxIndex(Number(card.id))}
        />
      </section>

      {lightboxIndex !== null && activePhoto && (
        <Dialog
          open
          onClose={() => setLightboxIndex(null)}
          title={activePhoto.alt}
          width="min(900px, calc(100vw - 32px))"
        >
          <div className={styles.lightboxBody}>
            <div className={styles.imageWrapper}>
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                sizes="(min-width: 900px) 860px, calc(100vw - 48px)"
                className={styles.image}
              />
            </div>
            <p className={styles.caption}>{activePhoto.alt}</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setLightboxIndex(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
