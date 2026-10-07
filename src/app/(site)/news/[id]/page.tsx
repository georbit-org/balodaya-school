import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one } from '@/server/db';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

interface NoticeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const noticeId = parseInt(id, 10);
  if (!isNaN(noticeId)) {
    const notice = await one<{ title: string }>(
      "SELECT title FROM notices WHERE id = ? AND published = 1 AND audience = 'public'",
      [noticeId]
    ).catch(() => null);
    if (notice?.title) {
      return {
        title: `${notice.title} | Balodaya Secondary English Boarding School`,
        description: `Official school announcement from Balodaya Secondary School: ${notice.title}`,
      };
    }
  }

  return {
    title: `Notice #${id} | Balodaya Secondary English Boarding School`,
    description: `Official school announcement and notice details from Balodaya Secondary School.`,
  };
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  const noticeId = parseInt(id, 10);

  if (isNaN(noticeId)) {
    notFound();
  }

  const notice = await one<{
    id: number;
    title: string;
    body: string;
    kind: string;
    event_date: string | null;
    attachment_path: string | null;
    created_at: string;
  }>(
    "SELECT id, title, body, kind, event_date, attachment_path, created_at FROM notices WHERE id = ? AND published = 1 AND audience = 'public'",
    [noticeId]
  ).catch(() => null);

  if (!notice) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.detailHeader}>
          <Link href="/news" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            &larr; Back to all notices
          </Link>
          <h1 className={styles.title}>Notice #{id}</h1>
        </div>
        <div className={styles.detailBody}>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            This notice is not currently available or has been archived.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.detailHeader}>
        <Link href="/news" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          &larr; Back to all notices
        </Link>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginTop: 'var(--sp-2)' }}>
          <span className={styles.newsKindBadge}>{notice.kind}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
            Published: {notice.created_at.slice(0, 10)}
          </span>
          {notice.event_date && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>
              Event Date: {notice.event_date}
            </span>
          )}
        </div>
        <h1 className={styles.title}>{notice.title}</h1>
      </div>

      <div className={styles.detailBody}>
        <div className={styles.bodyContent}>{notice.body}</div>

        {notice.attachment_path && (
          <div className={styles.attachmentBox}>
            <span aria-hidden="true">&#128206;</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Attachment</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                Download associated document
              </span>
            </div>
            <a
              href={notice.attachment_path}
              download
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            >
              Download &darr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
