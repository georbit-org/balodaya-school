import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className || ''}`}
      {...props}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
