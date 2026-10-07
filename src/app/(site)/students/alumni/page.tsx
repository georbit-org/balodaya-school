import React from 'react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlumniForm } from './AlumniForm';
import { query } from '@/server/db';
import styles from '../students.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alumni Network & Voices | Balodaya Secondary English Boarding School',
  description: `Connect with former students, graduates, and scholars of Balodaya Secondary School, Bheerkot-06. Share career journeys and memories.`,
};

export default async function AlumniPage() {
  const rows = await query<{
    id: number;
    name: string;
    body: string;
    extra: string | null;
  }>("SELECT id, name, body, extra FROM messages WHERE kind = 'alumni' AND status = 'published' ORDER BY id DESC").catch(() => []);

  const publishedAlumni = rows.map((r) => {
    let batchYear = 'Alumnus';
    if (r.extra) {
      try {
        const parsed = JSON.parse(r.extra);
        if (parsed.batchYear) batchYear = parsed.batchYear;
      } catch {}
    }
    return {
      id: r.id,
      name: r.name,
      batchYear,
      message: r.body,
    };
  });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Alumni Network</h1>
        <p className={styles.subtitle}>
          Celebrating the journeys, academic achievements, and contributions of Balodaya graduates across Nepal and abroad.
        </p>
      </header>

      {/* Published Alumni Reflections */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Alumni Messages &amp; Reflections</h2>

        {publishedAlumni.length > 0 ? (
          <div className={styles.gridCards}>
            {publishedAlumni.map((item) => (
              <div key={item.id} className={styles.quoteCard}>
                <p className={styles.quoteText}>&ldquo;{item.message}&rdquo;</p>
                <div className={styles.quoteAuthor}>
                  <strong style={{ color: 'var(--ink)' }}>{item.name}</strong>
                  <span>Batch of {item.batchYear}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No alumni messages published yet."
            description="Recent graduates are invited to submit their messages and career updates using the form below."
          />
        )}
      </div>

      {/* Alumni Submission Form */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Join the Alumni Directory</h2>
        <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-base)' }}>
          Are you a Balodaya graduate? Reconnect with your alma mater and inspire current students.
        </p>
        <AlumniForm />
      </div>
    </div>
  );
}
