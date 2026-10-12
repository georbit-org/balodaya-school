'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

interface WizardStep {
  number: number;
  title: string;
  description: string;
  link: string;
  buttonText: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    number: 1,
    title: 'School Identity, Contact & Social Links',
    description: 'Set official school name (EN & NE), motto, contact phones, email, physical address, and logo.',
    link: '/app/site/identity',
    buttonText: 'Configure Identity →',
  },
  {
    number: 2,
    title: 'Academic Year, Calendar & Weekly Off Days',
    description: 'Establish the Bikram Sambat academic session, set Saturday (or custom) weekly off days, and input term exam dates.',
    link: '/app/settings',
    buttonText: 'Set Working Week & Calendar →',
  },
  {
    number: 3,
    title: 'Class & Section Structure',
    description: 'Create Classes (Grade 1 to 10), assign sections (A, B, C), and allocate designated Class Teachers.',
    link: '/app/settings/classes',
    buttonText: 'Manage Classes →',
  },
  {
    number: 4,
    title: 'Subjects & Timetable Matrix',
    description: 'Define syllabus subjects, credit hours, and assign weekly timetable slots to teachers.',
    link: '/app/timetable',
    buttonText: 'Setup Timetable →',
  },
  {
    number: 5,
    title: 'Fee Categories & Class Fee Structures',
    description: 'Create tuition, admission, exam, and transport fee heads and assign monthly NPR amounts per grade.',
    link: '/app/fees/structure',
    buttonText: 'Set Fee Structure →',
  },
  {
    number: 6,
    title: 'Multi-Step Leave & Approval Workflows',
    description: 'Configure approval hierarchies: student leaves reviewed by class teacher, staff leaves approved by Principal.',
    link: '/app/settings/workflows',
    buttonText: 'Setup Approval Chains →',
  },
  {
    number: 7,
    title: 'Visual Branding & Website CMS',
    description: 'Customize Himalayan sky blue theme colors, review homepage sections, hero slides, and notices.',
    link: '/app/site/theme',
    buttonText: 'Theme & Pages →',
  },
  {
    number: 8,
    title: 'Final Health & Readiness Diagnostic',
    description: 'Run our automated scan to verify all classes, timetables, fee heads, and backup rules pass audit checks.',
    link: '/app/settings/health',
    buttonText: 'Run Health Audit →',
  },
];

export default function SetupWizardPage() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="School Onboarding & Setup Wizard"
        description="Step-by-step checklist to configure Balodaya Secondary School's academic rules, working calendar, faculty, fee structures, and public website."
        actions={
          <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
            ← Settings Center
          </Link>
        }
      />

      <div className={styles.introCard}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.125rem' }}>Administrator Setup Guide</h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
          Follow these 8 steps in order to ensure smooth operation for teachers taking attendance, accountants collecting fees, and parents accessing portal features. You can return to this wizard at any time.
        </p>
      </div>

      <div className={styles.stepsContainer}>
        {WIZARD_STEPS.map((step) => (
          <div key={step.number} className={styles.stepRow}>
            <div className={styles.stepLeft}>
              <div className={styles.stepNum}>{step.number}</div>
              <div>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </div>
            <Link
              href={step.link}
              className="button primary"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
            >
              {step.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
