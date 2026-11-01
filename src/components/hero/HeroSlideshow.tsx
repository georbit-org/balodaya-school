'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { HeroSlideRecord } from '@/app/api/hero-slides/route';
import { SCHOOL_INFO } from '@/content/school';
import { Icon, type IconName } from '@/components/ui/Icon';
import styles from './HeroSlideshow.module.css';

interface HeroSlideshowProps {
  initialSlides: HeroSlideRecord[];
}

const utilityItems: Array<{ label: string; href: string; icon: IconName }> = [
  { label: 'About', href: '/about', icon: 'building' },
  { label: 'Student Life', href: '/student-life', icon: 'users' },
  { label: 'Facilities', href: '/facilities', icon: 'building' },
  { label: 'Gallery', href: '/gallery', icon: 'grid' },
  { label: 'Exam Results', href: '/students/results', icon: 'reports' },
  { label: 'Resources', href: '/students/resources', icon: 'resources' },
  { label: 'Careers', href: '/careers', icon: 'vacancies' },
  { label: 'Contact', href: '/contact', icon: 'phone' },
];

export function HeroSlideshow({ initialSlides }: HeroSlideshowProps) {
  const [slides, setSlides] = useState<HeroSlideRecord[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
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
    if (isHovered || slideCount <= 1) {
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
  }, [isHovered, slideCount, goToNext]);

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
      {/* Video-first hero media wrapper */}
      <div className={styles.mediaWrapper}>
        <video
          className={styles.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/assets/videos/balodaya%20school.mp4" type="video/mp4" />
        </video>

        {/* Sky-blue atmospheric gradient overlay */}
        <div className={styles.skyAtmosphereOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.heroKicker}>
              <span className={styles.kickerRule} aria-hidden="true" />
              {activeSlides[currentIndex]?.badge || 'Learning with purpose'}
            </p>
            <h2 className={styles.heroTitle}>
              {activeSlides[currentIndex]?.title || SCHOOL_INFO.shortName}
            </h2>
            <p className={styles.heroSubtitle}>
              {activeSlides[currentIndex]?.subtitle || SCHOOL_INFO.motto}
            </p>
            <div className={styles.heroActions}>
              {activeSlides[currentIndex]?.primary_cta_text && (
                <a
                  href={activeSlides[currentIndex].primary_cta_link || '/about'}
                  className={styles.primaryAction}
                >
                  {activeSlides[currentIndex].primary_cta_text}
                  <span aria-hidden="true">&#8594;</span>
                </a>
              )}
              {activeSlides[currentIndex]?.secondary_cta_text && (
                <a
                  href={activeSlides[currentIndex].secondary_cta_link || '/contact'}
                  className={styles.secondaryAction}
                >
                  {activeSlides[currentIndex].secondary_cta_text}
                </a>
              )}
            </div>
          </div>

          <div className={styles.heroMeta}>
            <span>{SCHOOL_INFO.location.municipality}</span>
            <span className={styles.metaDivider} aria-hidden="true" />
            <span>Est. {SCHOOL_INFO.establishedBS}</span>
          </div>
        </div>

        <nav className={styles.utilityDock} aria-label="Quick school links">
          <div className={styles.utilityItems}>
            {utilityItems.map((item) => (
              <a key={item.href} href={item.href} className={styles.utilityItem}>
                <span className={styles.utilityIcon} aria-hidden="true">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className={styles.utilityLabel}>{item.label}</span>
              </a>
            ))}

          </div>
        </nav>
      </div>
    </section>
  );
}
