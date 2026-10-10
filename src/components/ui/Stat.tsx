import React from 'react';
import Link from 'next/link';
import { Sparkline } from './Sparkline';
import { Icon } from './Icon';
import styles from './Stat.module.css';

export interface StatTrend {
  dir: 'up' | 'down';
  text: string;
}

export interface StatProps {
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  trend?: StatTrend;
  sparklineData?: number[];
  className?: string;
}

export function Stat({
  label,
  value,
  subtext,
  href,
  trend,
  sparklineData,
  className = '',
}: StatProps) {
  const content = (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.headerRow}>
        <span className={styles.label}>{label}</span>
        {href && (
          <span className={styles.arrowIcon} aria-hidden="true">
            <Icon name="chevron-right" size={14} />
          </span>
        )}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline
            data={sparklineData}
            width={72}
            height={24}
            color={trend?.dir === 'down' ? 'var(--danger)' : 'var(--sky-accent)'}
            fillColor={trend?.dir === 'down' ? 'var(--danger-wash)' : 'var(--sky-wash)'}
          />
        )}
      </div>

      {(subtext || trend) && (
        <div className={styles.footerRow}>
          {subtext && <span className={styles.subtext}>{subtext}</span>}
          {trend && (
            <span
              className={`${styles.trendBadge} ${
                trend.dir === 'up' ? styles.trendUp : styles.trendDown
              }`}
            >
              <Icon
                name={trend.dir === 'up' ? 'trend-up' : 'trend-down'}
                size={12}
              />
              <span>{trend.text}</span>
            </span>
          )}
        </div>
      )}
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
