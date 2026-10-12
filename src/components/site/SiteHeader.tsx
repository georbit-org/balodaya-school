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

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLLIElement>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMoreOpen(false);
  }

  // Click outside listener for "More" dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        {/* Brand identity */}
        <Link href="/" className={styles.brand} aria-label={`${SCHOOL_INFO.name} Home`}>
          <div className={styles.logoWrapper}>
            <Image
              src={SCHOOL_INFO.logo}
              alt=""
              width={38}
              height={38}
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

        {/* Desktop navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <ul className={styles.navList}>
            {MAIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            {/* More dropdown */}
            <li className={styles.moreItem} ref={moreRef}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.moreButton}`}
                onClick={() => setMoreOpen((prev) => !prev)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                <span>More</span>
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

        {/* Actions slot */}
        <div className={styles.actionsSlot}>
          <a
            href={`tel:${SCHOOL_INFO.contact.phone}`}
            className={styles.phoneLink}
            aria-label={`Call office at ${SCHOOL_INFO.contact.phone}`}
          >
            {SCHOOL_INFO.contact.phone}
          </a>
          <Button href="/login" variant="secondary" size="sm">
            Sign in
          </Button>
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <Icon name="x" size={20} /> : <Icon name="menu" size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Mobile Menu">
          <nav className={styles.mobileNav}>
            <div className={styles.mobileSection}>
              <span className={styles.mobileSectionTitle}>Main Menu</span>
              <ul className={styles.mobileList}>
                {MAIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.mobileLink}
                      onClick={() => setMobileOpen(false)}
                    >
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
                    <Link
                      href={item.href}
                      className={styles.mobileLink}
                      onClick={() => setMobileOpen(false)}
                    >
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
