import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBox } from '@/components/ui/SearchBox';
import styles from '../students.module.css';

export const metadata: Metadata = {
  title: 'Board Exam Results | Balodaya Secondary English Boarding School',
  description: `Official public verification portal for Class 10 (SEE) and Class 12 board examination results at Balodaya Secondary School.`,
};

interface ResultsPageProps {
  searchParams: Promise<{
    classLevel?: string;
    q?: string;
  }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { classLevel = 'Class 10', q = '' } = await searchParams;

  const publishedResults: Array<{
    id: number;
    studentName: string;
    admissionNo: string;
    classLevel: string;
    examName: string;
    gpa: number;
    grade: string;
  }> = [];

  const filtered = publishedResults.filter((r) => {
    if (classLevel && r.classLevel !== classLevel) return false;
    if (q) {
      const match =
        r.studentName.toLowerCase().includes(q.toLowerCase()) ||
        r.admissionNo.toLowerCase().includes(q.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Class 10 &amp; 12 Board Results</h1>
        <p className={styles.subtitle}>
          Public verification portal for Secondary Education Examination (SEE) Class 10 and National Examination Board (NEB) Class 12 academic results.
        </p>
      </header>

      <div className={styles.panel}>
        <div className={styles.filterBar}>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Link
              href="/students/results?classLevel=Class%2010"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                backgroundColor: classLevel === 'Class 10' ? 'var(--accent-wash)' : 'var(--surface)',
                color: classLevel === 'Class 10' ? 'var(--accent)' : 'var(--ink)',
                fontWeight: classLevel === 'Class 10' ? 600 : 400,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              Class 10 (SEE)
            </Link>
            <Link
              href="/students/results?classLevel=Class%2012"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                backgroundColor: classLevel === 'Class 12' ? 'var(--accent-wash)' : 'var(--surface)',
                color: classLevel === 'Class 12' ? 'var(--accent)' : 'var(--ink)',
                fontWeight: classLevel === 'Class 12' ? 600 : 400,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              Class 12 (NEB)
            </Link>
          </div>

          <SearchBox placeholder="Search by student name or admission no..." />
        </div>

        {filtered.length > 0 ? (
          <ul className={styles.itemsList}>
            {filtered.map((item) => (
              <li key={item.id} className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.studentName}</span>
                  <span className={styles.itemMeta}>
                    Adm No: {item.admissionNo} | {item.classLevel} | {item.examName}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 'var(--text-lg)' }}>
                    GPA: {item.gpa.toFixed(2)}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
                    Grade: {item.grade}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No published public results for this selection."
            description="Board examination rosters and formal marksheet verifications are published following state accreditation announcements."
          />
        )}
      </div>
    </div>
  );
}
