import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className = '', label = 'Loading…' }: SpinnerProps) {
  return (
    <div className={`${styles.container} ${className}`} role="status">
      <div className={`${styles.circle} ${styles[size]}`} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
