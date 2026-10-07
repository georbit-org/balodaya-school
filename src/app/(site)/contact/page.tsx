import React from 'react';
import type { Metadata } from 'next';
import { SCHOOL_INFO } from '@/content/school';
import { ContactForm } from './ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact Us | Balodaya Secondary English Boarding School',
  description: `Contact Balodaya Secondary School in Sundar Bazar, Bheerkot-06, Syangja. Phone numbers, email directory, administrative office inquiries, and campus location.`,
};

export default function ContactPage() {
  const mapsQuery = 'https://www.google.com/maps/search/?api=1&query=Balodaya+Secondary+English+Boarding+School+Bheerkot+Syangja';

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Contact the School Office</h1>
        <p className={styles.subtitle}>
          We welcome inquiries from prospective families, enrolled parents, alumni, and community members. Visit our administrative desk or send a message below.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Contact Details */}
        <div className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Campus Location &amp; Contact</h2>

          <ul className={styles.detailsList}>
            <li className={styles.detailItem}>
              <span className={styles.detailLabel}>Campus Address</span>
              <span className={styles.detailValue}>
                {SCHOOL_INFO.name}
                <br />
                {SCHOOL_INFO.location.address}
                <br />
                {SCHOOL_INFO.location.municipality}, {SCHOOL_INFO.location.district}
                <br />
                {SCHOOL_INFO.location.province}, {SCHOOL_INFO.location.country}
              </span>
            </li>

            <li className={styles.detailItem}>
              <span className={styles.detailLabel}>Direct Telephone</span>
              <a href={`tel:${SCHOOL_INFO.contact.phone}`} className={`${styles.detailValue} ${styles.detailLink}`}>
                +977 {SCHOOL_INFO.contact.phone}
              </a>
            </li>

            <li className={styles.detailItem}>
              <span className={styles.detailLabel}>Email Inquiries</span>
              <a href={`mailto:${SCHOOL_INFO.contact.email}`} className={`${styles.detailValue} ${styles.detailLink}`}>
                {SCHOOL_INFO.contact.email}
              </a>
            </li>

            <li className={styles.detailItem}>
              <span className={styles.detailLabel}>Established</span>
              <span className={styles.detailValue}>{SCHOOL_INFO.establishedBS}</span>
            </li>
          </ul>

          <div className={styles.mapLinkWrapper}>
            <a
              href={mapsQuery}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: 'var(--sp-2) var(--sp-4)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className={styles.formCard}>
          <h2 className={styles.cardTitle}>Send an Inquiry</h2>
          <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-sm)' }}>
            Submit your question directly to the administration desk. We will respond promptly by telephone or email.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
