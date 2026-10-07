import React from 'react';
import type { Metadata } from 'next';
import { TCRequestForm } from './TCRequestForm';
import styles from '../students.module.css';

export const metadata: Metadata = {
  title: 'Request Transfer Certificate | Balodaya Secondary English Boarding School',
  description: `Official application portal to request a Transfer Certificate (TC) or School Leaving Certificate from Balodaya Secondary School.`,
};

export default function TransferCertificatePage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Transfer Certificate Request</h1>
        <p className={styles.subtitle}>
          Students seeking a formal School Leaving or Transfer Certificate must submit their details below. All library books and tuition balances must be cleared prior to issuance.
        </p>
      </header>

      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Application Form</h2>
        <TCRequestForm />
      </div>
    </div>
  );
}
