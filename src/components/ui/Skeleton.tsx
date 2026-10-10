import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'line' | 'block' | 'stat' | 'tableRows';
  rows?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'line',
  rows = 5,
  width,
  height,
  className,
  style,
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
  };

  if (variant === 'stat') {
    return (
      <div className={`${styles.skeleton} ${styles.stat} ${className || ''}`} style={customStyle} aria-hidden="true">
        <div className={`${styles.skeleton} ${styles.statLabel}`} />
        <div className={`${styles.skeleton} ${styles.statValue}`} />
        <div className={`${styles.skeleton} ${styles.statSub}`} />
      </div>
    );
  }

  if (variant === 'tableRows') {
    return (
      <div className={`${styles.tableRows} ${className || ''}`} aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.tableRow}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className || ''}`}
      style={customStyle}
      aria-hidden="true"
    />
  );
}
