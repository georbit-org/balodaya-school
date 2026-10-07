import React from 'react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';
import { TestimonialForm } from './TestimonialForm';
import { query } from '@/server/db';
import styles from '../students.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Testimonials | Balodaya Secondary English Boarding School',
  description: `Genuine words and perspectives from parents, guardians, and alumni of Balodaya Secondary School, Bheerkot-06.`,
};

export default async function TestimonialsPage() {
  const rows = await query<{
    id: number;
    name: string;
    body: string;
    extra: string | null;
  }>("SELECT id, name, body, extra FROM messages WHERE kind = 'testimonial' AND status = 'published' ORDER BY id DESC").catch(() => []);

  const publishedTestimonials = rows.map((r) => {
    let role = 'Parent / Community Member';
    if (r.extra) {
      try {
        const parsed = JSON.parse(r.extra);
        if (parsed.role) role = parsed.role;
      } catch {}
    }
    return {
      id: r.id,
      name: r.name,
      role,
      message: r.body,
    };
  });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Parent &amp; Community Testimonials</h1>
        <p className={styles.subtitle}>
          Read firsthand perspectives on learning culture, student progress, and values at Balodaya Secondary School.
        </p>
      </header>

      {/* Published Testimonials */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Community Feedback</h2>

        {publishedTestimonials.length > 0 ? (
          <div className={styles.gridCards}>
            {publishedTestimonials.map((item) => (
              <div key={item.id} className={styles.quoteCard}>
                <p className={styles.quoteText}>&ldquo;{item.message}&rdquo;</p>
                <div className={styles.quoteAuthor}>
                  <strong style={{ color: 'var(--ink)' }}>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No testimonials published yet."
            description="We welcome parents, alumni, and community members to share their genuine experiences."
          />
        )}
      </div>

      {/* Submission Form */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Share Your Feedback</h2>
        <TestimonialForm />
      </div>
    </div>
  );
}
