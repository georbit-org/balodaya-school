import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SCHOOL_INFO } from '@/content/school';
import { LEADERSHIP_INFO } from '@/content/leadership';
import { EmptyState } from '@/components/ui/EmptyState';
import { query } from '@/server/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us | Balodaya Secondary English Boarding School',
  description: `Learn about the origin, vision, leadership, and policies of Balodaya Secondary School in Sundar Bazar, Bheerkot-06, Syangja.`,
};

export default async function AboutPage() {
  const policyResources = await query<{ id: number; title: string; file_path: string }>(`
    SELECT id, title, file_path
    FROM resources
    WHERE published = 1 AND kind = 'policy'
    ORDER BY id DESC
  `).catch(() => []);

  const historyPhotos = [
    { src: '/assets/images/history/founder.jpeg', alt: 'Founders of Balodaya School' },
    { src: '/assets/images/history/founder_principal1.jpg', alt: 'Early administration and leadership' },
    { src: '/assets/images/history/1.jpg', alt: 'School establishment milestone' },
    { src: '/assets/images/history/2.jpg', alt: 'Historical assembly gathering' },
  ];

  return (
    <div className={`container ${styles.page}`}>
      {/* SECTION 1: ORIGIN */}
      <section id="origin" className={styles.section} aria-labelledby="origin-heading">
        <h1 id="origin-heading" className={styles.sectionTitle}>
          Our Origin &amp; History
        </h1>
        <div className={styles.originGrid}>
          <div className={styles.originTextColumn}>
            <p className={styles.originText}>{SCHOOL_INFO.originText}</p>
          </div>
          <div className={styles.originPhotos}>
            {historyPhotos.map((photo, idx) => (
              <div key={idx} className={styles.originPhotoWrapper}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 840px) 25vw, 45vw"
                  className={styles.originPhoto}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: VISION & MISSION */}
      <section id="vision" className={styles.section} aria-labelledby="vision-heading">
        <h2 id="vision-heading" className={styles.sectionTitle}>
          Vision &amp; Mission
        </h2>
        <div className={styles.visionMissionGrid}>
          <div className={styles.card}>
            <div className={styles.originPhotoWrapper} style={{ marginBottom: 'var(--sp-2)' }}>
              <Image
                src="/assets/images/vision-mission/building.jpeg"
                alt="Balodaya School academic campus building in Sundar Bazar"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className={styles.originPhoto}
              />
            </div>
            <h3 className={styles.cardHeading}>Our Vision</h3>
            <p className={styles.cardBody}>{SCHOOL_INFO.visionText}</p>
          </div>
          <div className={styles.card}>
            <div className={styles.originPhotoWrapper} style={{ marginBottom: 'var(--sp-2)' }}>
              <Image
                src="/assets/images/vision-mission/long.jpg"
                alt="Panoramic view of Balodaya School sports grounds and campus"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className={styles.originPhoto}
              />
            </div>
            <h3 className={styles.cardHeading}>Our Mission</h3>
            <p className={styles.cardBody}>{SCHOOL_INFO.missionText}</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: LEADERSHIP */}
      <section id="leadership" className={styles.section} aria-labelledby="leadership-heading">
        <h2 id="leadership-heading" className={styles.sectionTitle}>
          School Leadership
        </h2>
        <div className={styles.leadershipGrid}>
          {/* Chairman */}
          <div className={styles.leaderCard}>
            <div className={styles.leaderHeader}>
              <Image
                src={LEADERSHIP_INFO.chairman.image}
                alt={LEADERSHIP_INFO.chairman.name}
                width={72}
                height={72}
                className={styles.leaderPhoto}
              />
              <div className={styles.leaderMeta}>
                <h3 className={styles.leaderName}>{LEADERSHIP_INFO.chairman.name}</h3>
                <span className={styles.leaderTitle}>{LEADERSHIP_INFO.chairman.title}</span>
              </div>
            </div>
            <p className={styles.leaderMessage}>&ldquo;{LEADERSHIP_INFO.chairman.message}&rdquo;</p>
          </div>

          {/* Principal */}
          <div className={styles.leaderCard}>
            <div className={styles.leaderHeader}>
              <Image
                src={LEADERSHIP_INFO.principal.image}
                alt={LEADERSHIP_INFO.principal.name}
                width={72}
                height={72}
                className={styles.leaderPhoto}
              />
              <div className={styles.leaderMeta}>
                <h3 className={styles.leaderName}>{LEADERSHIP_INFO.principal.name}</h3>
                <span className={styles.leaderTitle}>{LEADERSHIP_INFO.principal.title}</span>
              </div>
            </div>
            <p className={styles.leaderMessage}>&ldquo;{LEADERSHIP_INFO.principal.message}&rdquo;</p>
          </div>
        </div>

        {/* Team Section */}
        <div className={styles.teamBlock}>
          <p className={styles.teamQuote}>&ldquo;{LEADERSHIP_INFO.teamQuote}&rdquo;</p>
          <div className={styles.teamPhotosGrid}>
            {LEADERSHIP_INFO.teamImages.map((img, idx) => (
              <div key={idx} className={styles.teamPhotoWrapper}>
                <Image
                  src={img}
                  alt={`Balodaya faculty and leadership group ${idx + 1}`}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: RULES & REGULATIONS */}
      <section id="rules" className={styles.section} aria-labelledby="rules-heading">
        <h2 id="rules-heading" className={styles.sectionTitle}>
          Rules &amp; Regulations
        </h2>
        <div className={styles.rulesContainer}>
          <p className={styles.rulesIntro}>
            Balodaya maintains clear academic, attendance, and conduct guidelines to foster an environment of discipline and mutual respect. Official policy documents and downloadable forms are provided below.
          </p>

          <div className={styles.downloadRow}>
            <span className={styles.downloadIcon} aria-hidden="true">&#128196;</span>
            <div className={styles.downloadDetails}>
              <a
                href="/assets/documents/student-leave-application.pdf"
                download
                className={styles.downloadTitle}
              >
                Student Leave Application Form (PDF)
              </a>
              <span className={styles.downloadMeta}>Official school leave application procedure</span>
            </div>
            <a
              href="/assets/documents/student-leave-application.pdf"
              download
              className={styles.downloadTitle}
            >
              Download &darr;
            </a>
          </div>

          {policyResources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {policyResources.map((res) => (
                <div key={res.id} className={styles.downloadRow}>
                  <span className={styles.downloadIcon} aria-hidden="true">&#128196;</span>
                  <div className={styles.downloadDetails}>
                    <a href={`/api/resources/${res.id}/download`} download className={styles.downloadTitle}>
                      {res.title}
                    </a>
                  </div>
                  <a href={`/api/resources/${res.id}/download`} download className={styles.downloadTitle}>
                    Download &darr;
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No additional policy documents published yet."
              description="Additional school policies, circulars, and handbooks will appear here when uploaded by the administration."
            />
          )}
        </div>
      </section>
    </div>
  );
}
