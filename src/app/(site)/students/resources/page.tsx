import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBox } from '@/components/ui/SearchBox';
import { query } from '@/server/db';
import styles from '../students.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Academic Resources & Question Banks | Balodaya Secondary English Boarding School',
  description: `Official past question banks, examination portions, model test papers, and curricular study resources for Balodaya students.`,
};

interface ResourcesPageProps {
  searchParams: Promise<{
    kind?: string;
    q?: string;
  }>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const { kind = 'all', q = '' } = await searchParams;

  const academicResources = await query<{
    id: number;
    title: string;
    kind: 'question-bank' | 'exam-portion';
    className: string;
    subjectName: string;
    file_path: string;
  }>(`
    SELECT r.id, r.title, r.kind,
           COALESCE(c.name, 'All Classes') AS className,
           COALESCE(sub.name, 'General') AS subjectName,
           r.file_path
    FROM resources r
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN subjects sub ON r.subject_id = sub.id
    WHERE r.published = 1 AND r.kind IN ('question-bank', 'exam-portion')
    ORDER BY r.id DESC
  `).catch(() => []);

  const filtered = academicResources.filter((r) => {
    if (kind !== 'all' && r.kind !== kind) return false;
    if (q) {
      const match =
        r.title.toLowerCase().includes(q.toLowerCase()) ||
        r.className.toLowerCase().includes(q.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(q.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Academic Resources &amp; Question Banks</h1>
        <p className={styles.subtitle}>
          Official model questions, term exam portions, syllabus breakdowns, and revision archives for all class levels.
        </p>
      </header>

      <div className={styles.panel}>
        <div className={styles.filterBar}>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Link
              href="/students/resources"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                backgroundColor: kind === 'all' ? 'var(--accent-wash)' : 'var(--surface)',
                color: kind === 'all' ? 'var(--accent)' : 'var(--ink)',
                fontWeight: kind === 'all' ? 600 : 400,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              All Resources
            </Link>
            <Link
              href="/students/resources?kind=question-bank"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                backgroundColor: kind === 'question-bank' ? 'var(--accent-wash)' : 'var(--surface)',
                color: kind === 'question-bank' ? 'var(--accent)' : 'var(--ink)',
                fontWeight: kind === 'question-bank' ? 600 : 400,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              Question Banks
            </Link>
            <Link
              href="/students/resources?kind=exam-portion"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                backgroundColor: kind === 'exam-portion' ? 'var(--accent-wash)' : 'var(--surface)',
                color: kind === 'exam-portion' ? 'var(--accent)' : 'var(--ink)',
                fontWeight: kind === 'exam-portion' ? 600 : 400,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              Exam Portions
            </Link>
          </div>

          <SearchBox placeholder="Search by subject, class, or topic..." />
        </div>

        {filtered.length > 0 ? (
          <ul className={styles.itemsList}>
            {filtered.map((item) => (
              <li key={item.id} className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>
                    {item.className} &bull; {item.subjectName} &bull; {item.kind === 'question-bank' ? 'Question Bank' : 'Exam Portion'}
                  </span>
                </div>
                <a href={`/api/resources/${item.id}/download`} download className={styles.itemLink}>
                  Download Document &darr;
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No academic resources published yet."
            description="Subject question banks and term syllabus portions will appear here when uploaded by department teachers."
          />
        )}
      </div>
    </div>
  );
}
