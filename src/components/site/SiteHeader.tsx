'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SCHOOL_INFO } from '@/content/school';
import { MAIN_NAV, MORE_NAV } from '@/content/nav';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './SiteHeader.module.css';

const topLeftNav = [
  { label: 'Admissions', href: '/admissions', icon: 'applications' as const },
  { label: 'Academics', href: '/academics', icon: 'file-text' as const },
];

const topRightNav = [{ label: 'News', href: '/news', icon: 'notices' as const }];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLLIElement>(null);
  const isHome = pathname === '/';

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMoreOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`${styles.header} ${isHome ? styles.heroHeader : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        <nav className={`${styles.desktopNav} ${styles.leftDesktopNav}`} aria-label="Primary Navigation">
          <ul className={styles.navList}>
            {topLeftNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon name={item.icon} size={25} className={styles.navIcon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/" className={styles.brand} aria-label={`${SCHOOL_INFO.name} Home`}>
          <div className={styles.logoWrapper}>
            <Image
              src={SCHOOL_INFO.logo}
              alt=""
              width={200}
              height={200}
              priority
              className={styles.logo}
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>{SCHOOL_INFO.shortName}</span>
            <span className={styles.brandLocation}>
              {SCHOOL_INFO.location.address}, {SCHOOL_INFO.location.district}
            </span>
          </div>
        </Link>

        <div className={styles.rightHeaderGroup}>
          <nav className={`${styles.desktopNav} ${styles.rightDesktopNav}`} aria-label="Secondary Navigation">
            <ul className={styles.navList}>
              {topRightNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon name={item.icon} size={25} className={styles.navIcon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              <li className={styles.moreItem} ref={moreRef}>
                <button
                  type="button"
                  className={`${styles.navLink} ${styles.moreButton}`}
                  onClick={() => setMoreOpen((previous) => !previous)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  <Icon name="menu" size={25} className={styles.navIcon} />
                  <span>Menu</span>
                  <span className={styles.caret} aria-hidden="true">▾</span>
                </button>

                {moreOpen && (
                  <div className={styles.dropdownMenu} role="menu">
                    {MORE_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.dropdownLink}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          </nav>

          <div className={styles.actionsSlot}>
            <a
              href={`tel:${SCHOOL_INFO.contact.phone}`}
              className={styles.phoneLink}
              aria-label={`Call office at ${SCHOOL_INFO.contact.phone}`}
              title={`Call office at ${SCHOOL_INFO.contact.phone}`}
            >
              <Icon name="phone" size={25} />
              <span className={styles.phoneNumber}>{SCHOOL_INFO.contact.phone}</span>
              <span> Contact</span>
            </a>
            {/* <Button href="/login" variant="secondary" size="sm">
              Sign in
            </Button> */}
            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileOpen((previous) => !previous)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <Icon name="x" size={20} /> : <Icon name="menu" size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Mobile Menu">
          <nav className={styles.mobileNav}>
            <div className={styles.mobileSection}>
              <span className={styles.mobileSectionTitle}>Main Menu</span>
              <ul className={styles.mobileList}>
                {MAIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.mobileSection}>
              <span className={styles.mobileSectionTitle}>Explore School</span>
              <ul className={styles.mobileList}>
                {MORE_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.mobileActions}>
              <Button href="/login" variant="primary" style={{ width: '100%' }}>
                Portal Sign In
              </Button>
              <a href={`tel:${SCHOOL_INFO.contact.phone}`} className={styles.mobilePhone}>
                Call Office: {SCHOOL_INFO.contact.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}