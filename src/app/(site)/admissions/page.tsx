import React from 'react';
import type { Metadata } from 'next';
import { SCHOOL_INFO } from '@/content/school';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdmissionForm } from './AdmissionForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Admissions & Enrollment | Balodaya Secondary English Boarding School',
  description: `Apply for student admission at Balodaya Secondary School, Bheerkot-06, Syangja. Transparent admission policies and streamlined enrollment process.`,
};

export default function AdmissionsPage() {
  const admissionPolicies: Array<{ id: number; title: string; file_path: string }> = [];

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>Student Admissions</h1>
        <p className={styles.subtitle}>
          Welcome to the admissions portal of {SCHOOL_INFO.name}. We accept students from Nursery through secondary levels based on seat availability and age readiness.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Admission Policies */}
        <div className={styles.policyColumn}>
          <div className={styles.policyCard}>
            <h2 className={styles.columnHeading}>Admission Policies</h2>
            <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
              All applications are processed through the school administration office in Sundar Bazar, Bheerkot-06. Please review our institutional guidelines prior to application submission.
            </p>

            {admissionPolicies.length > 0 ? (
              <ul className={styles.policyList}>
                {admissionPolicies.map((policy) => (
                  <li key={policy.id} className={styles.policyItem}>
                    <span className={styles.policyTitle}>{policy.title}</span>
                    <a href={policy.file_path} download className={styles.policyLink}>
                      Download &darr;
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Policies will be published soon."
                description="The administration will publish formal admission policy handbooks and fee schedules here."
              />
            )}
          </div>
        </div>

        {/* Right Column: Online Application Form */}
        <div className={styles.formCard}>
          <h2 className={styles.columnHeading}>Online Application Form</h2>
          <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 'var(--text-sm)' }}>
            Complete the form below to initiate the enrollment process. Fields marked with an asterisk (<span style={{ color: 'var(--danger)' }}>*</span>) are required.
          </p>
          <AdmissionForm />
        </div>
      </div>
    </div>
  );
}
