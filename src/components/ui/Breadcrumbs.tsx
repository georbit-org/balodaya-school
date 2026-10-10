'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  app: 'SMS',
  dashboard: 'Dashboard',
  students: 'Students',
  applications: 'Applications',
  staff: 'Staff',
  users: 'Users',
  classes: 'Classes & Subjects',
  attendance: 'Attendance',
  leave: 'Leave Requests',
  exams: 'Examinations',
  timetable: 'Timetable',
  fees: 'Fees & Invoices',
  payments: 'Payments & Receipts',
  notices: 'Notices',
  library: 'Library',
  transport: 'Transport',
  houses: 'Houses',
  resources: 'Resources',
  'hero-slides': 'Hero Slideshow',
  vacancies: 'Careers',
  tenders: 'Tenders',
  messages: 'Inquiries',
  settings: 'Settings',
  'academic-year': 'Academic Years',
  'grade-scale': 'Grade Scale',
  'audit-log': 'Audit Log',
  school: 'School Profile',
  backup: 'Database Backup',
  account: 'Account',
  password: 'Password & Security',
  reports: 'Reports & Exports',
  print: 'Official Prints',
  receipt: 'Receipt',
  marksheet: 'Marksheet',
  tc: 'Transfer Certificate',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs: BreadcrumbItem[] = items || buildFromPathname(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`${styles.nav} ${className || ''}`} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <li key={crumb.href || idx} className={styles.item}>
              {idx > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  <Icon name="chevron-right" size={12} />
                </span>
              )}
              {isLast || !crumb.href ? (
                <span className={styles.current} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className={styles.link}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildFromPathname(pathname: string): BreadcrumbItem[] {
  if (!pathname) return [];
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;
    const label = ROUTE_LABELS[seg] || formatSegment(seg);
    crumbs.push({
      label,
      href: i === segments.length - 1 ? undefined : currentPath,
    });
  }

  return crumbs;
}

function formatSegment(seg: string): string {
  // If numeric or ID
  if (/^\d+$/.test(seg)) return `#${seg}`;
  return seg
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
