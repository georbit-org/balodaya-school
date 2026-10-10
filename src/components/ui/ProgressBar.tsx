import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function ProgressBar({
  value,
  variant = 'accent',
  className,
  style,
  ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

  return (
    <div
      className={`${styles.track} ${className || ''}`}
      style={style}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={`${styles.fill} ${styles[variant]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
