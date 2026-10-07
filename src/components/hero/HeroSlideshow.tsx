'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeroSlideRecord } from '@/app/api/hero-slides/route';
import styles from './HeroSlideshow.module.css';

interface HeroSlideshowProps {
  initialSlides: HeroSlideRecord[];
}

export function HeroSlideshow({ initialSlides }: HeroSlideshowProps) {
  const [slides, setSlides] = useState<HeroSlideRecord[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // If initial slides were empty, fetch from API on mount
  useEffect(() => {
    if (!initialSlides || initialSlides.length === 0) {
      fetch('/api/hero-slides')
        .then((res) => res.json())
        .then((data) => {
          if (data?.docs && data.docs.length > 0) {
            setSlides(data.docs);
          }
        })
        .catch(() => {
          // Graceful ignore
        });
    }
  }, [initialSlides]);

  const activeSlides = slides.filter((s) => s.is_active !== 0 && s.active !== false);
  const slideCount = activeSlides.length;

  const goToNext = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const goToPrev = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Autoplay handler
  useEffect(() => {
    if (!isPlaying || isHovered || slideCount <= 1) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      goToNext();
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isPlaying, isHovered, slideCount, goToNext]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrev();
    }
  };

  if (slideCount === 0) {
    return null;
  }

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <section
      className={styles.carousel}
      aria-label="Balodaya School Feature Highlights"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Visual Media Banner Wrapper */}
      <div className={styles.mediaWrapper}>
        {activeSlides.map((slide, idx) => (
          <div
            key={slide.id || `slide-${idx}`}
            className={`${styles.slideImageWrapper} ${
              idx === currentIndex ? styles.slideActive : ''
            }`}
            aria-hidden={idx !== currentIndex}
          >
            <Image
              src={slide.image}
              alt={slide.title || 'Balodaya School Campus'}
              fill
              priority={idx === 0}
              sizes="100vw"
              className={styles.image}
            />
          </div>
        ))}

        {/* Sky-blue atmospheric gradient overlay */}
        <div className={styles.skyAtmosphereOverlay} />

        {/* Tactile HUD Controls */}
        <div className={styles.mediaControlsHud} aria-label="Slideshow controls">
          <span className={styles.slideCounter} aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
          </span>

          <button
            type="button"
            className={styles.hudButton}
            onClick={goToPrev}
            aria-label="Previous slide"
            title="Previous slide (Left Arrow)"
          >
            &#8592;
          </button>

          <button
            type="button"
            className={styles.hudButton}
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            type="button"
            className={styles.hudButton}
            onClick={goToNext}
            aria-label="Next slide"
            title="Next slide (Right Arrow)"
          >
            &#8594;
          </button>
        </div>

        {/* Progress Indicator Pills */}
        <div className={styles.progressIndicatorBar} role="tablist" aria-label="Slides">
          {activeSlides.map((s, idx) => (
            <button
              key={`pill-${s.id || idx}`}
              type="button"
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
              className={`${styles.progressPill} ${
                idx === currentIndex ? styles.progressPillActive : ''
              }`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </div>

      {/* Overlapping Surface Card with Sky Blue Elevation */}
      <div className={`container ${styles.overlayContainer}`}>
        <div className={styles.heroCard}>
          {currentSlide.badge && (
            <div className={styles.badgeChip}>
              <span>{currentSlide.badge}</span>
            </div>
          )}

          <h1 className={styles.heroTitle}>{currentSlide.title}</h1>

          {currentSlide.subtitle && (
            <p className={styles.heroSubtitle}>{currentSlide.subtitle}</p>
          )}

          <div className={styles.heroActions}>
            <Link
              href={currentSlide.primary_cta_link || currentSlide.primaryCtaLink || '/admissions'}
              className={styles.primaryCta}
            >
              {currentSlide.primary_cta_text || currentSlide.primaryCtaText || 'Apply for admission'} &rarr;
            </Link>

            {(currentSlide.secondary_cta_link || currentSlide.secondaryCtaLink) && (
              <Link
                href={currentSlide.secondary_cta_link || currentSlide.secondaryCtaLink || '/contact'}
                className={styles.secondaryCta}
              >
                {currentSlide.secondary_cta_text || currentSlide.secondaryCtaText || 'Contact us'} &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
