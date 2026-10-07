import React from 'react';
import Link from 'next/link';
import styles from './Stat.module.css';

export interface StatProps {
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  className?: string;
}

export function Stat({ label, value, subtext, href, className = '' }: StatProps) {
  const content = (
    <div className={`${styles.card} ${className}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {subtext && <span className={styles.subtext}>{subtext}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={styles.linkWrapper}>
        {content}
      </Link>
    );
  }

  return content;
}
