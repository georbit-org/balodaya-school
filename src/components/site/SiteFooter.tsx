import React from 'react';
import Link from 'next/link';
import { SCHOOL_INFO } from '@/content/school';
import { MAIN_NAV, MORE_NAV } from '@/content/nav';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.container}`}>
        <div className={styles.columns}>
          {/* Column 1: School Identity & Contact */}
          <div className={styles.column}>
            <p className={styles.schoolName}>{SCHOOL_INFO.name}</p>
            <p className={styles.motto}>&ldquo;{SCHOOL_INFO.motto}&rdquo;</p>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <span className={styles.contactLabel}>Address:</span>
                <span>
                  {SCHOOL_INFO.location.address}, {SCHOOL_INFO.location.municipality},{' '}
                  {SCHOOL_INFO.location.district}, {SCHOOL_INFO.location.country}
                </span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactLabel}>Phone:</span>
                <a href={`tel:${SCHOOL_INFO.contact.phone}`} className={styles.contactLink}>
                  +977 {SCHOOL_INFO.contact.phone}
                </a>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactLabel}>Email:</span>
                <a href={`mailto:${SCHOOL_INFO.contact.email}`} className={styles.contactLink}>
                  {SCHOOL_INFO.contact.email}
                </a>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactLabel}>Estd:</span>
                <span>{SCHOOL_INFO.establishedBS}</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Main Pages */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Navigation</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/" className={styles.contactLink}>
                  Home
                </Link>
              </li>
              {MAIN_NAV.map((item) => (
                <li key={item.href} className={styles.linkItem}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li className={styles.linkItem}>
                <Link href="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academic & Student Services */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Information &amp; Services</h3>
            <ul className={styles.linkList}>
              {MORE_NAV.slice(0, 7).map((item) => (
                <li key={item.href} className={styles.linkItem}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li className={styles.linkItem}>
                <Link href="/login" className={styles.systemLink}>
                  Portal Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {currentYear} {SCHOOL_INFO.name}. All rights reserved.
          </p>
          <p className={styles.copyright}>
            Bheerkot-06, Syangja, Gandaki Province, Nepal
          </p>
        </div>
      </div>
    </footer>
  );
}
