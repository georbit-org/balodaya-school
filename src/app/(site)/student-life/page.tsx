import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { HOUSES_INFO, HOUSES_INTRO, HOUSES_PHOTOS } from '@/content/houses';
import { COUNCIL_MEMBERS, COUNCIL_FEATURE_IMAGES } from '@/content/council';
import { EmptyState } from '@/components/ui/EmptyState';
import { query } from '@/server/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Life, Houses & Leadership | Balodaya Secondary English Boarding School',
  description: `Discover student life at Balodaya: collegiate house system, elected student council leaders, co-curricular clubs, and campus events.`,
};

export default async function StudentLifePage() {
  const pointsRows = await query<{ name: string; total_points: number }>(`
    SELECT h.name, COALESCE(SUM(hp.points), 0) AS total_points
    FROM houses h
    LEFT JOIN house_points hp ON h.id = hp.house_id
    GROUP BY h.id, h.name
  `).catch(() => []);

  const housePoints: Record<string, number> = {};
  for (const r of pointsRows) {
    housePoints[r.name] = Number(r.total_points);
  }

  const events = await query<{ id: number; title: string; event_date: string | null }>(`
    SELECT id, title, event_date
    FROM notices
    WHERE published = 1 AND audience = 'public' AND kind = 'event'
    ORDER BY id DESC
    LIMIT 6
  `).catch(() => []);

  const schoolActivities = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.event_date || '',
  }));

  return (
    <div className={`container ${styles.page}`}>
      {/* SECTION 1: HOUSES */}
      <section id="houses" className={styles.section} aria-labelledby="houses-heading">
        <div className={styles.sectionHeader}>
          <h1 id="houses-heading" className={styles.sectionTitle}>
            Collegiate Houses
          </h1>
          <p className={styles.sectionDesc}>{HOUSES_INTRO}</p>
        </div>

        <div className={styles.housesGrid}>
          {HOUSES_INFO.map((house) => {
            const points = housePoints[house.name];
            return (
              <div
                key={house.name}
                className={styles.houseCard}
                style={{ borderLeftColor: house.colorToken }}
              >
                <h2 className={styles.houseName}>{house.name} House</h2>
                <p className={styles.houseMotto}>&ldquo;{house.motto}&rdquo;</p>
                {points !== undefined && (
                  <span className={styles.housePoints}>{points} Points</span>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.housePhotosGrid}>
          {HOUSES_PHOTOS.map((src, idx) => (
            <div key={idx} className={styles.housePhotoWrapper}>
              <Image
                src={src}
                alt={`House activities and honors ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: COUNCIL LEADERS */}
      <section id="leaders" className={styles.section} aria-labelledby="leaders-heading">
        <div className={styles.sectionHeader}>
          <h2 id="leaders-heading" className={styles.sectionTitle}>
            Student Council Leaders
          </h2>
          <p className={styles.sectionDesc}>
            Elected student prefects and captains entrusted with upholding school discipline, promoting peer mentorship, and leading cultural and sports activities.
          </p>
        </div>

        <div className={styles.councilGrid}>
          {COUNCIL_MEMBERS.map((member, idx) => (
            <div key={idx} className={styles.councilItem}>
              <span className={styles.councilName}>{member.name}</span>
              <span className={styles.councilPost}>{member.post}</span>
            </div>
          ))}
        </div>

        <div className={styles.councilPhotosGrid}>
          {COUNCIL_FEATURE_IMAGES.map((src, idx) => (
            <div key={idx} className={styles.councilPhotoWrapper}>
              <Image
                src={src}
                alt={`Student Council team ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: CLUBS */}
      <section id="clubs" className={styles.section} aria-labelledby="clubs-heading">
        <div className={styles.sectionHeader}>
          <h2 id="clubs-heading" className={styles.sectionTitle}>
            Student Clubs
          </h2>
        </div>
        <div className={styles.activitiesCard}>
          <EmptyState
            title="Clubs have not been published yet."
            description="School club schedules, science societies, and literary forums will appear here when posted by faculty advisors."
          />
        </div>
      </section>

      {/* SECTION 4: SCHOOL ACTIVITIES */}
      <section id="activities" className={styles.section} aria-labelledby="activities-heading">
        <div className={styles.sectionHeader}>
          <h2 id="activities-heading" className={styles.sectionTitle}>
            School Activities &amp; Events
          </h2>
        </div>

        <div className={styles.councilPhotosGrid} style={{ marginBottom: 'var(--sp-4)' }}>
          <div className={styles.councilPhotoWrapper}>
            <Image
              src="/assets/images/gallery/1/original/1691748192-YogaDay.jpg"
              alt="International Yoga Day demonstration"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={styles.councilPhotoWrapper}>
            <Image
              src="/assets/images/gallery/1/original/1691748399-Experra interschool English debate competition.jpg"
              alt="Interschool English debate championship"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={styles.councilPhotoWrapper}>
            <Image
              src="/assets/images/gallery/1/original/1701233091-C1.jpeg"
              alt="Traditional Nepali cultural stage dance"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        <div className={styles.activitiesCard}>
          {schoolActivities.length > 0 ? (
            <div>
              {schoolActivities.map((act) => (
                <div key={act.id}>
                  <span>{act.title}</span>
                  <span>{act.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming school activities scheduled."
              description="Announcements regarding annual sports day, cultural exhibits, and parent conferences will be listed here."
            />
          )}
        </div>
      </section>
    </div>
  );
}
