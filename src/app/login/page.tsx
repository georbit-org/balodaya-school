import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SCHOOL_INFO } from '@/content/school';
import { LoginForm } from './LoginForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Sign In | Balodaya Secondary English Boarding School',
  description: `Sign in to Balodaya School Management Portal for administrators, faculty, parents, and students.`,
};

export default function LoginPage() {
  return (
    <div className={styles.container}>
      {/* Left Brand Panel */}
      <section className={styles.brandPanel} aria-label="School Identity">
        <div className={styles.brandContent}>
          <div className={styles.logoWrapper}>
            <Image
              src={SCHOOL_INFO.logo}
              alt=""
              width={54}
              height={54}
              priority
            />
          </div>
          <h1 className={styles.schoolName}>{SCHOOL_INFO.name}</h1>
          <p className={styles.motto}>&ldquo;{SCHOOL_INFO.motto}&rdquo;</p>
        </div>

        <div className={styles.brandFooter}>
          <p style={{ margin: 0 }}>
            {SCHOOL_INFO.location.address}, {SCHOOL_INFO.location.municipality}
          </p>
          <Link href="/" className={styles.homeLink}>
            &larr; Back to Public Website
          </Link>
        </div>
      </section>

      {/* Right Form Panel */}
      <section className={styles.formPanel} aria-label="Portal Authentication">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Sign In</h2>
            <p className={styles.cardSubtitle}>
              Enter your credentials to access the school management system.
            </p>
          </div>

          <Suspense fallback={<p>Loading authentication form...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
