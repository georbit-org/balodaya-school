import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { SCHOOL_INFO } from '@/content/school';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Academics & Curriculum | Balodaya Secondary English Boarding School',
  description: `Academic levels, curriculum frameworks, and subject offerings at Balodaya Secondary School, from Foundational to Secondary levels.`,
};

interface LevelDefinition {
  id: string;
  name: string;
  range: string;
  classNames: string[];
  image: string;
}

const ACADEMIC_LEVELS: LevelDefinition[] = [
  {
    id: 'foundational',
    name: 'Foundational',
    range: 'Class 1 and 2',
    classNames: ['Class 1', 'Class 2'],
    image: '/assets/images/home_page/banner/original/1689139552-IMG-20230711-WA0028.jpg',
  },
  {
    id: 'prep',
    name: 'Preparatory',
    range: 'Class 3 to 5',
    classNames: ['Class 3', 'Class 4', 'Class 5'],
    image: '/assets/images/gallery/1/original/1688705351-cocurricular1.jpg',
  },
  {
    id: 'middle',
    name: 'Middle School',
    range: 'Class 6 to 8',
    classNames: ['Class 6', 'Class 7', 'Class 8'],
    image: '/assets/images/gallery/1/original/1688705352-cocurricular5.jpg',
  },
  {
    id: 'secondary',
    name: 'Secondary',
    range: 'Class 9 to 12',
    classNames: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    image: '/assets/images/home_page/banner/original/1689073769-2Banner2.jpg',
  },
  {
    id: 'atal',
    name: 'ATAL Tinkering Lab & Applied Sciences',
    range: 'Innovation & Practical Sciences',
    classNames: [],
    image: '/assets/images/gallery/1/original/1688705352-cocurricular2.jpg',
  },
  {
    id: 'inclusive',
    name: 'Inclusive Education & Holistic Growth',
    range: 'Differentiated Support & Mentorship',
    classNames: [],
    image: '/assets/images/gallery/1/original/1691748192-YogaDay.jpg',
  },
];

export default async function AcademicsPage() {
  const levelSubjects: Record<string, string[]> = {
    foundational: [],
    prep: [],
    middle: [],
    secondary: [],
    atal: [],
    inclusive: [],
  };

  try {
    const { query } = await import('@/server/db');
    const rows = await query<{ class_name: string; subject_name: string }>(`
      SELECT DISTINCT c.name as class_name, s.name as subject_name
      FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects s ON cs.subject_id = s.id
      ORDER BY s.name
    `);

    for (const r of rows) {
      for (const level of ACADEMIC_LEVELS) {
        if (level.classNames.includes(r.class_name)) {
          if (!levelSubjects[level.id].includes(r.subject_name)) {
            levelSubjects[level.id].push(r.subject_name);
          }
        }
      }
    }
  } catch {
    // If db query fails during build or before setup, gracefully keep empty
  }

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Academic Curriculum</h1>
        <p className={styles.subtitle}>
          Balodaya Secondary English Boarding School provides a structured academic progression fostering intellectual rigor, critical inquiry, and character development across foundational to secondary tiers.
        </p>
      </header>

      <div className={styles.levelsGrid}>
        {ACADEMIC_LEVELS.map((level) => {
          const subjects = levelSubjects[level.id] || [];

          return (
            <section key={level.id} className={styles.levelCard} aria-labelledby={`level-${level.id}`}>
              <div className={styles.levelHeader}>
                <h2 id={`level-${level.id}`} className={styles.levelName}>
                  {level.name}
                </h2>
                <span className={styles.levelRange}>{level.range}</span>
              </div>

              <div className={styles.levelContentGrid}>
                <div className={styles.levelImageWrapper}>
                  <Image
                    src={level.image}
                    alt={level.name}
                    fill
                    sizes="(min-width: 768px) 240px, 100vw"
                    className={styles.levelImage}
                  />
                </div>

                <div>
                  <p className={styles.curriculumNote}>
                    Structured curriculum aligned with national education board standards, emphasizing practical applications, concept mastery, and bilingual fluency.
                  </p>

                  <div className={styles.subjectsSection}>
                    <h3 className={styles.subjectsTitle}>Subjects</h3>
                    {subjects.length > 0 ? (
                      <ul className={styles.subjectsList}>
                        {subjects.map((sub, idx) => (
                          <li key={idx} className={styles.subjectBadge}>
                            {sub}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.noSubjects}>
                        Subject list will be populated by the administration.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
