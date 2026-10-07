import React from 'react';
import type { Metadata } from 'next';
import { query } from '@/server/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Procurement & Tenders | Balodaya Secondary English Boarding School',
  description: `Official procurement notifications, civil works invitations, and equipment tenders for Balodaya Secondary School, Bheerkot-06.`,
};

const PREVIOUS_TENDERS = [
  {
    id: 1,
    title: 'Tender Notice 111: Pathway Edge Wall Construction in Garden Area (Solid Blocks ~700 sqft)',
    filePath: '/assets/images/tender/1702378989-111 -   Construction of new pathway edge wall both side in garden area by using solid blocks and painting it total size approx. 700sqft.pdf',
    date: 'Previous Notice',
  },
  {
    id: 2,
    title: 'Tender Notice 112: Prefabricated Rooms for NCC, Band & Music Classes',
    filePath: '/assets/images/tender/1702379020-112    PREFABRICATED ROOMS FROM NCC, BAND & MUSIC CLASSES.pdf',
    date: 'Previous Notice',
  },
  {
    id: 3,
    title: 'Tender Notice 113: Corridors and Pathways for Prefabricated Assembly Hall and Classrooms',
    filePath: '/assets/images/tender/1702379047-113    CORRIDORSPATHWAYS FOR PREFABRICATED ASSEMBLY HALL AND CLASS ROOMS.pdf',
    date: 'Previous Notice',
  },
];

export default async function TendersPage() {
  const dynamicTenders = await query<{
    id: number;
    title: string;
    description: string | null;
    file_path: string | null;
    deadline: string | null;
  }>('SELECT id, title, description, file_path, deadline FROM tenders WHERE published = 1 ORDER BY id DESC').catch(() => []);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Procurement &amp; Tenders</h1>
        <p className={styles.subtitle}>
          Public invitations for sealed quotation, civil construction works, facility enhancements, and instructional supply tenders.
        </p>
      </header>

      {/* Dynamic Tenders if available */}
      {dynamicTenders.length > 0 ? (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Active Tenders</h2>
          <ul className={styles.tendersList}>
            {dynamicTenders.map((tender) => (
              <li key={tender.id} className={styles.tenderCard}>
                <div className={styles.tenderInfo}>
                  <h3 className={styles.tenderTitle}>{tender.title}</h3>
                  <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-sm)' }}>
                    {tender.description}
                  </p>
                  <span className={styles.tenderMeta}>Submission Deadline: {tender.deadline}</span>
                </div>
                {tender.file_path && (
                  <a href={tender.file_path} download className={styles.downloadBtn}>
                    Download Document &darr;
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Previous Tender Notices</h2>
          <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-base)' }}>
            There are currently no open sealed bids. Reference archive of past procurement circulars:
          </p>
          <ul className={styles.tendersList}>
            {PREVIOUS_TENDERS.map((item) => (
              <li key={item.id} className={styles.tenderCard}>
                <div className={styles.tenderInfo}>
                  <h3 className={styles.tenderTitle}>{item.title}</h3>
                  <span className={styles.tenderMeta}>{item.date}</span>
                </div>
                <a href={item.filePath} download className={styles.downloadBtn}>
                  Download Tender PDF &darr;
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
