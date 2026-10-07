import React from 'react';
import type { Metadata } from 'next';
import { JobApplicationForm } from './JobApplicationForm';
import { query } from '@/server/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Careers & Faculty Vacancies | Balodaya Secondary English Boarding School',
  description: `Teaching and administrative job vacancies at Balodaya Secondary School, Bheerkot-06, Syangja. Join our faculty and educational community.`,
};

export default async function CareersPage() {
  const vacancies = await query<{
    id: number;
    title: string;
    type: 'teaching' | 'non-teaching';
    description: string | null;
    deadline: string | null;
  }>('SELECT id, title, type, description, deadline FROM vacancies WHERE published = 1 ORDER BY id DESC').catch(() => []);

  const teachingVacancies = vacancies.filter((v) => v.type === 'teaching');
  const nonTeachingVacancies = vacancies.filter((v) => v.type === 'non-teaching');

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Faculty &amp; Staff Careers</h1>
        <p className={styles.subtitle}>
          Join a dedicated team of educators and administrative professionals shaping academic excellence in Bheerkot Municipality.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Vacancy Groups */}
        <div className={styles.vacanciesColumn}>
          {/* Teaching Staff */}
          <section className={styles.categoryCard} aria-labelledby="teaching-vacancies">
            <h2 id="teaching-vacancies" className={styles.categoryTitle}>
              Teaching Faculty
            </h2>
            {teachingVacancies.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {teachingVacancies.map((v) => (
                  <li key={v.id} style={{ paddingBlock: 'var(--sp-2)' }}>
                    <strong>{v.title}</strong>
                    <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{v.description}</p>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                      Deadline: {v.deadline}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyNotice}>
                TEACHING STAFF: Vacancies will be updated soon!
              </p>
            )}
          </section>

          {/* Non-Teaching Staff */}
          <section className={styles.categoryCard} aria-labelledby="non-teaching-vacancies">
            <h2 id="non-teaching-vacancies" className={styles.categoryTitle}>
              Non-Teaching &amp; Administrative Staff
            </h2>
            {nonTeachingVacancies.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {nonTeachingVacancies.map((v) => (
                  <li key={v.id} style={{ paddingBlock: 'var(--sp-2)' }}>
                    <strong>{v.title}</strong>
                    <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{v.description}</p>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                      Deadline: {v.deadline}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyNotice}>
                NON TEACHING STAFF: Vacancies will be updated soon!
              </p>
            )}
          </section>
        </div>

        {/* Right Column: Application Form */}
        <section className={styles.formCard} aria-labelledby="apply-heading">
          <h2 id="apply-heading" className={styles.formTitle}>
            Submit Faculty Application
          </h2>
          <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-sm)' }}>
            We review prospective applications on a rolling basis. Submit your details and resume below.
          </p>
          <JobApplicationForm />
        </section>
      </div>
    </div>
  );
}
