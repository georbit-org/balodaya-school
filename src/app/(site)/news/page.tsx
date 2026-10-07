import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBox } from '@/components/ui/SearchBox';
import { query } from '@/server/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'News & Official Notices | Balodaya Secondary English Boarding School',
  description: `Official school announcements, academic schedules, holiday notices, and co-curricular events from Balodaya Secondary School.`,
};

interface NewsPageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { tab = 'all', q = '', page = '1' } = await searchParams;

  const notices = await query<{
    id: number;
    title: string;
    body: string;
    kind: 'notice' | 'event';
    event_date: string | null;
    created_at: string;
  }>(
    "SELECT id, title, body, kind, event_date, created_at FROM notices WHERE published = 1 AND audience = 'public' ORDER BY id DESC"
  ).catch(() => []);

  const filtered = notices.filter((n) => {
    if (tab === 'notices' && n.kind !== 'notice') return false;
    if (tab === 'events' && n.kind !== 'event') return false;
    if (q) {
      const match = n.title.toLowerCase().includes(q.toLowerCase()) || n.body.toLowerCase().includes(q.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>School Notices &amp; News</h1>
        <p className={styles.subtitle}>
          Stay informed with institutional circulars, academic timelines, parent notices, and event updates.
        </p>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.filterTabs} role="tablist">
          <Link
            href="/news"
            className={`${styles.filterBtn} ${tab === 'all' ? styles.activeFilter : ''}`}
          >
            All Updates
          </Link>
          <Link
            href="/news?tab=notices"
            className={`${styles.filterBtn} ${tab === 'notices' ? styles.activeFilter : ''}`}
          >
            Notices
          </Link>
          <Link
            href="/news?tab=events"
            className={`${styles.filterBtn} ${tab === 'events' ? styles.activeFilter : ''}`}
          >
            Events
          </Link>
        </div>

        <SearchBox placeholder="Search circulars..." />
      </div>

      {filtered.length > 0 ? (
        <ul className={styles.newsList}>
          {filtered.map((item) => (
            <li key={item.id} className={styles.newsCard}>
              <div className={styles.newsMeta}>
                <span className={styles.newsKindBadge}>{item.kind}</span>
                <span>{item.event_date || item.created_at.slice(0, 10)}</span>
              </div>
              <Link href={`/news/${item.id}`} className={styles.newsTitleLink}>
                {item.title}
              </Link>
              <p className={styles.newsSnippet}>{item.body.slice(0, 180)}...</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No notices have been published yet."
          description={
            q
              ? `No announcements matching "${q}". Try modifying your search keywords.`
              : 'Official circulars and announcements will appear here when posted by the administration.'
          }
        />
      )}
    </div>
  );
}
