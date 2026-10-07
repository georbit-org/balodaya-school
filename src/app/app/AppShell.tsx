'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { SCHOOL_INFO } from '@/content/school';
import type { SessionUser } from '@/server/session';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  href: string;
  roles: Array<SessionUser['role']>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/app/dashboard', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'] },
      { label: 'Reports & Exports', href: '/app/reports', roles: ['admin', 'principal', 'teacher', 'accountant'] },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students Directory', href: '/app/students', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'] },
      { label: 'Admissions Applications', href: '/app/applications', roles: ['admin', 'principal'] },
      { label: 'Staff Directory', href: '/app/staff', roles: ['admin', 'principal'] },
      { label: 'User Accounts', href: '/app/users', roles: ['admin'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Classes & Subjects', href: '/app/classes', roles: ['admin', 'principal'] },
      { label: 'Daily Attendance', href: '/app/attendance', roles: ['admin', 'principal', 'teacher', 'parent', 'student'] },
      { label: 'Leave Requests', href: '/app/leave', roles: ['admin', 'principal', 'teacher', 'parent', 'student'] },
      { label: 'Exams & Marks', href: '/app/exams', roles: ['admin', 'principal', 'teacher', 'parent', 'student'] },
      { label: 'Class Timetable', href: '/app/timetable', roles: ['admin', 'principal', 'teacher', 'student'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fees & Invoices', href: '/app/fees', roles: ['admin', 'principal', 'accountant', 'parent', 'student'] },
      { label: 'Payments & Receipts', href: '/app/payments', roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'School',
    items: [
      { label: 'Notices & Circulars', href: '/app/notices', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'] },
      { label: 'Library Catalog', href: '/app/library', roles: ['admin', 'principal', 'teacher', 'student'] },
      { label: 'Transport Routes', href: '/app/transport', roles: ['admin', 'principal', 'parent', 'student'] },
      { label: 'Houses & Points', href: '/app/houses', roles: ['admin', 'principal', 'teacher', 'student'] },
      { label: 'Academic Resources', href: '/app/resources', roles: ['admin', 'principal', 'teacher', 'student'] },
    ],
  },
  {
    label: 'Website',
    items: [
      { label: 'Hero Slideshow', href: '/app/hero-slides', roles: ['admin', 'principal', 'teacher'] },
      { label: 'Careers & Vacancies', href: '/app/vacancies', roles: ['admin', 'principal'] },
      { label: 'Tenders & Bids', href: '/app/tenders', roles: ['admin', 'principal'] },
      { label: 'Inquiries & Messages', href: '/app/messages', roles: ['admin', 'principal'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Academic Years', href: '/app/settings/academic-year', roles: ['admin'] },
      { label: 'Grade Scale', href: '/app/settings/grade-scale', roles: ['admin'] },
    ],
  },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/students?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className={styles.shellLayout}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        aria-label="Portal Navigation"
      >
        <div className={styles.brandHeader}>
          <Image
            src={SCHOOL_INFO.logo}
            alt=""
            width={32}
            height={32}
            className={styles.brandLogo}
          />
          <span className={styles.brandTitle}>Balodaya SMS</span>
        </div>

        <nav className={styles.navContainer}>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className={styles.groupBlock}>
                <span className={styles.groupLabel}>{group.label}</span>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={styles.userFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{user.role}</span>
          </div>
          <Link
            href="/app/account/password"
            title="Change password"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', textDecoration: 'none' }}
          >
            &#9881;
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              &#9776;
            </button>
            <h1 className={styles.topbarTitle}>School Management Portal</h1>
          </div>

          <div className={styles.topbarRight}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to student..."
                className={styles.searchInput}
              />
            </form>

            <div className={styles.topbarActions}>
              <Link
                href="/app/account/password"
                className={styles.signOutBtn}
                style={{ textDecoration: 'none' }}
              >
                Security
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className={styles.signOutBtn}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
