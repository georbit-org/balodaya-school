import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SCHOOL_INFO } from '@/content/school';
import { LEADERSHIP_INFO } from '@/content/leadership';
import { HOUSES_INFO } from '@/content/houses';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { query } from '@/server/db';
import { HeroSlideshow } from '@/components/hero/HeroSlideshow';
import type { HeroSlideRecord } from '@/app/api/hero-slides/route';
import styles from './page.module.css';

import { readSession } from '@/server/session';
import { canServer } from '@/server/permissions';
import { getPageBySlug } from '@/server/cms';
import { PageRenderer } from '@/components/cms/PageRenderer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home | Balodaya Secondary English Boarding School',
  description: `${SCHOOL_INFO.name} in ${SCHOOL_INFO.location.address}, ${SCHOOL_INFO.location.district}. ${SCHOOL_INFO.motto}. Established ${SCHOOL_INFO.establishedBS}.`,
};

export default async function HomePage() {
  const session = await readSession().catch(() => null);
  const canEdit = session ? await canServer(session.role, 'cms.edit').catch(() => false) : false;

  const cmsPage = await getPageBySlug('', { includeDrafts: canEdit }).catch(() => null);
  if (cmsPage && cmsPage.sections && cmsPage.sections.length > 0) {
    return (
      <div className={styles.page}>
        <h1 className="srOnly">{SCHOOL_INFO.name} — Bheerkot, Syangja</h1>
        <PageRenderer page={cmsPage} canEdit={canEdit} />
      </div>
    );
  }
  const heroSlides = await query<HeroSlideRecord>(
    `SELECT id, badge, title, subtitle, image, 
            primary_cta_text, primary_cta_link, 
            secondary_cta_text, secondary_cta_link, 
            display_order, is_active
     FROM hero_slides 
     WHERE is_active = 1 
     ORDER BY display_order ASC, id ASC`
  ).catch(() => []);

  const notices = await query<{
    id: number;
    title: string;
    body: string;
    kind: string;
    created_at: string;
  }>(
    "SELECT id, title, body, kind, created_at FROM notices WHERE published = 1 AND audience = 'public' ORDER BY id DESC LIMIT 5"
  ).catch(() => []);

  const latestNotices = notices.map((n) => ({
    id: n.id,
    title: n.title,
    date: n.created_at ? n.created_at.split('T')[0] : '',
    kind: n.kind,
  }));

  const photoStripImages = [
    { src: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg', alt: 'Disciplined morning assembly at Balodaya' },
    { src: '/assets/images/gallery/1/original/1691748192-YogaDay.jpg', alt: 'International Yoga Day mass demonstration' },
    { src: '/assets/images/houses/top.jpeg', alt: 'Inter-house athletic meet on campus grounds' },
    { src: '/assets/images/houses/prize1.jpeg', alt: 'Annual sports day championship trophy presentation' },
    { src: '/assets/images/gallery/1/original/1691748399-Experra interschool English debate competition.jpg', alt: 'Interschool English debate competition champions' },
    { src: '/assets/images/gallery/1/original/1701233091-C1.jpeg', alt: 'Traditional Nepali cultural dance and stage drama' },
    { src: '/assets/images/gallery/1/original/1688705352-cocurricular2.jpg', alt: 'Co-curricular science and technology exhibits' },
    { src: '/assets/images/facilities/Digicamp1.JPG', alt: 'Computer science and digital learning lab (Digicamp)' },
  ];

  return (
    <div className={styles.page}>
      <h1 className="srOnly">{SCHOOL_INFO.name} — Bheerkot, Syangja</h1>

      {/* BLOCK 1: DYNAMIC HERO SLIDESHOW */}
      <HeroSlideshow initialSlides={heroSlides} />

      {/* BLOCK 2: WELCOME (LETTER LAYOUT) */}
      <section className={styles.letterSection} aria-labelledby="chairman-welcome">
        <div className={`container ${styles.letterContent}`}>
          <p className={styles.letterEyebrow}>From the Founder &amp; Chairman</p>
          <h2 id="chairman-welcome" className={styles.letterHeading}>
            A Message to Our School Community
          </h2>
          <blockquote className={styles.letterQuote}>
            &ldquo;{LEADERSHIP_INFO.chairman.message}&rdquo;
          </blockquote>
          <div className={styles.letterSignoff}>
            <Image
              src={LEADERSHIP_INFO.chairman.image}
              alt={LEADERSHIP_INFO.chairman.name}
              width={64}
              height={64}
              className={styles.chairmanPortrait}
            />
            <div className={styles.signoffInfo}>
              <span className={styles.signoffName}>{LEADERSHIP_INFO.chairman.name}</span>
              <span className={styles.signoffTitle}>{LEADERSHIP_INFO.chairman.title}</span>
              <Link href="/about#leadership" className={styles.signoffLink}>
                Read the principal&apos;s message &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCK 3: ABOUT US (TWO COLUMNS) */}
      <section className="container" aria-labelledby="about-heading">
        <div className={styles.aboutGrid}>
          <div className={styles.aboutTextColumn}>
            <h2 id="about-heading" className={styles.sectionHeading}>
              About Balodaya
            </h2>
            <p className={styles.bodyText}>{SCHOOL_INFO.aboutText}</p>
            <div>
              <Button variant="secondary" href="/about">
                Read our origin &amp; vision &rarr;
              </Button>
            </div>
          </div>
          <div className={styles.aboutImageWrapper}>
            <Image
              src="/assets/images/vision-mission/building.jpeg"
              alt="Balodaya Secondary School building in Sundar Bazar"
              fill
              sizes="(min-width: 840px) 45vw, 95vw"
              className={styles.aboutImage}
            />
          </div>
        </div>
      </section>

      {/* BLOCK 4: LATEST NOTICES (PLAIN LIST) */}
      <section className="container" aria-labelledby="notices-heading">
        <div className={styles.noticesSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 id="notices-heading" className={styles.sectionHeading}>
              Latest Notices
            </h2>
            <Link href="/news" className={styles.heroSecondaryLink}>
              All notices &rarr;
            </Link>
          </div>

          {latestNotices.length > 0 ? (
            <ul className={styles.noticeList}>
              {latestNotices.slice(0, 5).map((notice) => (
                <li key={notice.id} className={styles.noticeItem}>
                  <Link href={`/news/${notice.id}`} className={styles.noticeTitleLink}>
                    {notice.title}
                  </Link>
                  <span className={styles.noticeMeta}>{notice.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No notices have been published yet."
              description="School circulars, term notices, and event announcements will be posted here."
            />
          )}
        </div>
      </section>

      {/* BLOCK 5: PHOTO STRIP (5 UNMODIFIED PHOTOS) */}
      <section className="container" aria-labelledby="photo-strip-heading">
        <div className={styles.photoStripSection}>
          <div className={styles.photoStripHeader}>
            <h2 id="photo-strip-heading" className={styles.sectionHeading}>
              Campus Activities
            </h2>
            <Link href="/gallery" className={styles.heroSecondaryLink}>
              See the gallery &rarr;
            </Link>
          </div>
          <div className={styles.photoStripTrack}>
            {photoStripImages.map((img, idx) => (
              <div key={idx} className={styles.stripItem}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 20vw, 240px"
                  className={styles.stripImage}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCK 6: HOUSES (5 COLOURED VERTICAL BARS) */}
      <section className="container" aria-labelledby="houses-heading">
        <div className={styles.housesSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 id="houses-heading" className={styles.sectionHeading}>
              Collegiate Houses
            </h2>
            <Link href="/student-life#houses" className={styles.heroSecondaryLink}>
              House standings &rarr;
            </Link>
          </div>
          <div className={styles.housesGrid}>
            {HOUSES_INFO.map((house) => (
              <div
                key={house.name}
                className={styles.houseCard}
                style={{ borderLeftColor: house.colorToken }}
              >
                <h3 className={styles.houseName}>{house.name} House</h3>
                <p className={styles.houseMotto}>&ldquo;{house.motto}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCK 7: HOW TO APPLY (3 NUMBERED STEPS) */}
      <section className="container" aria-labelledby="apply-heading">
        <div className={styles.applySection}>
          <div className={styles.sectionHeaderRow}>
            <h2 id="apply-heading" className={styles.sectionHeading}>
              How to Apply
            </h2>
            <Link href="/admissions" className={styles.heroSecondaryLink}>
              Admission details &rarr;
            </Link>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>01</span>
              <p className={styles.stepText}>Fill in the online application</p>
            </div>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>02</span>
              <p className={styles.stepText}>The school office contacts you</p>
            </div>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>03</span>
              <p className={styles.stepText}>
                Visit the school with the documents the office asks for
              </p>
            </div>
          </div>
          <div className={styles.applyActions}>
            <Button variant="primary" href="/admissions">
              Start application
            </Button>
          </div>
        </div>
      </section>

      {/* BLOCK 8: QUOTE LINE */}
      <section className={`container ${styles.quoteSection}`} aria-label="School quote">
        <p className={styles.quoteText}>&ldquo;{SCHOOL_INFO.quotes[1]}&rdquo;</p>
      </section>
    </div>
  );
}
