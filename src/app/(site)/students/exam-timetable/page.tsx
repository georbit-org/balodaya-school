import React from 'react';
import type { Metadata } from 'next';
import styles from '../students.module.css';

export const metadata: Metadata = {
  title: 'Examination Timetable & Routine | Balodaya Secondary English Boarding School',
  description: `Official examination schedules, terminal test dates, and periodic exam timetables across all classes at Balodaya Secondary School.`,
};

const SCANNED_TIMETABLES = [
  {
    title: 'Periodic Test II & Pre-Board I Timetable (Class 1 to 5)',
    file: '/assets/images/examtime/1700453578-PERIODIC_TEST_2_&_PREBOARD_I_TIME_TABLE_-_2023-24_-_I_TO_V.pdf',
    level: 'Foundational & Preparatory',
  },
  {
    title: 'Periodic Test & Exam Timetable (Class 6 to 10)',
    file: '/assets/images/examtime/1700460011-class Vi to x.pdf',
    level: 'Middle & Secondary (Class 6 - 10)',
  },
  {
    title: 'Periodic Test II Timetable (Class 11)',
    file: '/assets/images/examtime/1700453656-PERIODIC_TEST_II_TIME_TABLE_-_2023-24_-_XI.pdf',
    level: 'Senior Secondary (Class 11)',
  },
  {
    title: 'Pre-Board I Examination Timetable (Class 12)',
    file: '/assets/images/examtime/1700453673-PREBOARD_I_TIME_TABLE_-_2023-24_-_XII.pdf',
    level: 'Senior Secondary (Class 12)',
  },
];

export default function ExamTimetablePage() {
  const dynamicSchedules: Array<{
    className: string;
    items: Array<{ subject: string; date: string; time: string }>;
  }> = [];

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Examination Timetables</h1>
        <p className={styles.subtitle}>
          Official date sheets, reporting schedules, and examination routines for terminal evaluations and board preparation tests.
        </p>
      </header>

      {/* Dynamic Database Schedules */}
      {dynamicSchedules.length > 0 && (
        <div className={styles.panel}>
          <h2 className={styles.panelHeading}>Current Examination Schedule</h2>
          {/* renders when populated */}
        </div>
      )}

      {/* Scanned Official Timetables */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Official Published Routines</h2>
        <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-base)' }}>
          Download official signed timetable documents issued by the examination controller.
        </p>

        <ul className={styles.itemsList}>
          {SCANNED_TIMETABLES.map((item, idx) => (
            <li key={idx} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemMeta}>{item.level}</span>
              </div>
              <a href={item.file} download className={styles.itemLink}>
                Download PDF &darr;
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
