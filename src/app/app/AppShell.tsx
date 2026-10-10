'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { SCHOOL_INFO } from '@/content/school';
import type { SessionUser } from '@/server/session';
import { Icon, IconName } from '@/components/ui/Icon';
import { KeyHint } from '@/components/ui/KeyHint';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Popover } from '@/components/ui/Popover';
import { CommandPalette } from '@/components/ui/CommandPalette';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles: Array<SessionUser['role']>;
  badgeKey?: 'applications' | 'leave' | 'messages' | 'notices';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/app/dashboard', icon: 'dashboard', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'] },
      { label: 'Reports & Exports', href: '/app/reports', icon: 'reports', roles: ['admin', 'principal', 'teacher', 'accountant'] },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students Directory', href: '/app/students', icon: 'students', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'] },
      { label: 'Admissions Applications', href: '/app/applications', icon: 'applications', roles: ['admin', 'principal'], badgeKey: 'applications' },
      { label: 'Staff Directory', href: '/app/staff', icon: 'staff', roles: ['admin', 'principal'] },
      { label: 'User Accounts', href: '/app/users', icon: 'users', roles: ['admin'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Classes & Subjects', href: '/app/classes', icon: 'classes', roles: ['admin', 'principal'] },
      { label: 'Daily Attendance', href: '/app/attendance', icon: 'attendance', roles: ['admin', 'principal', 'teacher', 'parent', 'student'] },
      { label: 'Leave Requests', href: '/app/leave', icon: 'leave', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badgeKey: 'leave' },
      { label: 'Exams & Marks', href: '/app/exams', icon: 'exams', roles: ['admin', 'principal', 'teacher', 'parent', 'student'] },
      { label: 'Class Timetable', href: '/app/timetable', icon: 'timetable', roles: ['admin', 'principal', 'teacher', 'student'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fees & Invoices', href: '/app/fees', icon: 'fees', roles: ['admin', 'principal', 'accountant', 'parent', 'student'] },
      { label: 'Payments & Receipts', href: '/app/payments', icon: 'receipt', roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'School',
    items: [
      { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badgeKey: 'notices' },
      { label: 'Library Catalog', href: '/app/library', icon: 'library', roles: ['admin', 'principal', 'teacher', 'student'] },
      { label: 'Transport Routes', href: '/app/transport', icon: 'transport', roles: ['admin', 'principal', 'parent', 'student'] },
      { label: 'Houses & Points', href: '/app/houses', icon: 'houses', roles: ['admin', 'principal', 'teacher', 'student'] },
      { label: 'Academic Resources', href: '/app/resources', icon: 'resources', roles: ['admin', 'principal', 'teacher', 'student'] },
    ],
  },
  {
    label: 'Website',
    items: [
      { label: 'Hero Slideshow', href: '/app/hero-slides', icon: 'slideshow', roles: ['admin', 'principal', 'teacher'] },
      { label: 'Careers & Vacancies', href: '/app/vacancies', icon: 'vacancies', roles: ['admin', 'principal'] },
      { label: 'Tenders & Bids', href: '/app/tenders', icon: 'tenders', roles: ['admin', 'principal'] },
      { label: 'Inquiries & Messages', href: '/app/messages', icon: 'messages', roles: ['admin', 'principal'], badgeKey: 'messages' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Academic Years', href: '/app/settings/academic-year', icon: 'calendar', roles: ['admin'] },
      { label: 'Grade Scale', href: '/app/settings/grade-scale', icon: 'settings', roles: ['admin'] },
      { label: 'Audit Trail', href: '/app/settings/audit-log', icon: 'clock', roles: ['admin', 'principal'] },
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
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [counts, setCounts] = useState<{ applications: number; leave: number; messages: number; notices: number }>({
    applications: 0,
    leave: 0,
    messages: 0,
    notices: 0,
  });

  const pathname = usePathname();
  const router = useRouter();

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedRail = localStorage.getItem('sms.rail.collapsed');
      if (savedRail) setRailCollapsed(JSON.parse(savedRail));

      const savedGroups = localStorage.getItem('sms.nav.groups');
      if (savedGroups) setCollapsedGroups(JSON.parse(savedGroups));
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Fetch pending badge counts
  const fetchCounts = useCallback(() => {
    fetch('/api/shell/counts')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCounts({
            applications: data.applications || 0,
            leave: data.leave || 0,
            messages: data.messages || 0,
            notices: data.notices || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    window.addEventListener('focus', fetchCounts);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchCounts);
    };
  }, [fetchCounts]);

  // Global keyboard shortcuts (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleRailCollapse = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sms.rail.collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupLabel]: !prev[groupLabel] };
      try {
        localStorage.setItem('sms.nav.groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className={styles.shellLayout}>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR RAIL */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} ${
          railCollapsed ? styles.sidebarCollapsed : ''
        }`}
        aria-label="Balodaya School Navigation"
      >
        <div className={styles.brandHeader}>
          <Link href="/app/dashboard" className={styles.brandLink}>
            <Image
              src={SCHOOL_INFO.logo}
              alt=""
              width={28}
              height={28}
              className={styles.brandLogo}
            />
            {!railCollapsed && (
              <div className={styles.brandTitles}>
                <span className={styles.brandTitle}>Balodaya</span>
                <span className={styles.brandSub}>Management System</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className={styles.railCollapseBtn}
            onClick={toggleRailCollapse}
            aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name="panel-left" size={16} />
          </button>
        </div>

        <nav className={styles.navContainer}>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            const isGroupActive = visibleItems.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
            );
            // If active, force open; otherwise respect user collapse
            const isCollapsed = !isGroupActive && Boolean(collapsedGroups[group.label]);

            return (
              <div key={group.label} className={styles.groupBlock}>
                {!railCollapsed && (
                  <button
                    type="button"
                    className={`${styles.groupHeader} ${isCollapsed ? styles.groupCollapsed : ''}`}
                    onClick={() => toggleGroup(group.label)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={styles.groupLabel}>{group.label}</span>
                    <span className={styles.groupChevron}>
                      <Icon name="chevron-down" size={12} />
                    </span>
                  </button>
                )}

                {(!isCollapsed || railCollapsed) &&
                  visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const count = item.badgeKey ? counts[item.badgeKey] : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        title={railCollapsed ? item.label : undefined}
                      >
                        <div className={styles.navLinkLeft}>
                          <span className={styles.navLinkIcon}>
                            <Icon name={item.icon} size={18} />
                          </span>
                          {!railCollapsed && <span className={styles.navLinkText}>{item.label}</span>}
                        </div>

                        {!railCollapsed && count > 0 && (
                          <span className={styles.countBadge}>{count}</span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfoGroup}>
            <Avatar name={user.name} size="sm" />
            {!railCollapsed && (
              <div className={styles.userInfoText}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRoleText}>{user.role}</span>
              </div>
            )}
          </div>

          <Link
            href="/app/account/password"
            className={styles.railCollapseBtn}
            title="Password & Security"
            aria-label="Password & Security"
          >
            <Icon name="lock" size={16} />
          </Link>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div
        className={`${styles.mainWrapper} ${
          railCollapsed ? styles.mainWrapperCollapsed : ''
        }`}
      >
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              <Icon name="menu" size={18} />
            </button>
            <Breadcrumbs />
          </div>

          <div className={styles.topbarRight}>
            {/* Search Trigger (Opens Command Palette) */}
            <button
              type="button"
              className={styles.searchTriggerBtn}
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette search"
            >
              <Icon name="search" size={15} />
              <span className={styles.searchTriggerPlaceholder}>Search SMS…</span>
              <KeyHint>Ctrl K</KeyHint>
            </button>

            <button
              type="button"
              className={styles.mobileSearchBtn}
              onClick={() => setPaletteOpen(true)}
              aria-label="Open search"
            >
              <Icon name="search" size={18} />
            </button>

            {/* Academic Session & BS Date Indicator */}
            <div className={styles.metaChip} title="Academic Session 2083/84 B.S.">
              <span>२०८३/८४</span>
            </div>

            {/* Notification Bell */}
            <Popover
              trigger={
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Recent notifications"
                >
                  <Icon name="bell" size={18} />
                  {(counts.applications > 0 || counts.leave > 0) && (
                    <span className={styles.bellDot} aria-hidden="true" />
                  )}
                </button>
              }
            >
              {(close) => (
                <div className={styles.userMenuPanel}>
                  <div className={styles.userMenuHeader}>
                    <span className={styles.userMenuName}>Notifications</span>
                    <span className={styles.userMenuEmail}>Live activity stream</span>
                  </div>
                  {counts.applications > 0 && (
                    <Link
                      href="/app/applications"
                      className={styles.userMenuItem}
                      onClick={close}
                    >
                      <Icon name="applications" size={16} />
                      <span>{counts.applications} pending admissions application(s)</span>
                    </Link>
                  )}
                  {counts.leave > 0 && (
                    <Link
                      href="/app/leave"
                      className={styles.userMenuItem}
                      onClick={close}
                    >
                      <Icon name="leave" size={16} />
                      <span>{counts.leave} pending leave request(s)</span>
                    </Link>
                  )}
                  {counts.messages > 0 && (
                    <Link
                      href="/app/messages"
                      className={styles.userMenuItem}
                      onClick={close}
                    >
                      <Icon name="messages" size={16} />
                      <span>{counts.messages} new public inquiry message(s)</span>
                    </Link>
                  )}
                  <Link
                    href="/app/notices"
                    className={styles.userMenuItem}
                    onClick={close}
                  >
                    <Icon name="notices" size={16} />
                    <span>View all circulars and notices</span>
                  </Link>
                </div>
              )}
            </Popover>

            {/* User Profile Menu Popover */}
            <Popover
              trigger={
                <button
                  type="button"
                  className={styles.userMenuTrigger}
                  aria-label="User account menu"
                >
                  <Avatar name={user.name} size="sm" />
                  <Badge variant="info">{user.role}</Badge>
                  <Icon name="chevron-down" size={12} />
                </button>
              }
            >
              {(close) => (
                <div className={styles.userMenuPanel}>
                  <div className={styles.userMenuHeader}>
                    <span className={styles.userMenuName}>{user.name}</span>
                    <span className={styles.userMenuEmail}>{user.email}</span>
                  </div>

                  <Link
                    href="/app/account/password"
                    className={styles.userMenuItem}
                    onClick={close}
                  >
                    <Icon name="lock" size={16} />
                    <span>Password &amp; Security</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/app/settings/audit-log"
                      className={styles.userMenuItem}
                      onClick={close}
                    >
                      <Icon name="clock" size={16} />
                      <span>System Audit Trail</span>
                    </Link>
                  )}

                  <div className={styles.userMenuDivider} />

                  <button
                    type="button"
                    className={`${styles.userMenuItem} ${styles.userMenuSignOut}`}
                    onClick={() => {
                      close();
                      handleSignOut();
                    }}
                  >
                    <Icon name="logout" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </Popover>
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
