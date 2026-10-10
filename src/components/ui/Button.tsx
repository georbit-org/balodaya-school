import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  href?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  href,
  iconLeft,
  iconRight,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const combinedClass = `${styles.btn} ${styles[variant]} ${styles[size]} ${className}`;

  const content = loading ? (
    <span className={styles.loadingWrapper}>
      <span className={styles.spinner} aria-hidden="true" />
      <span>Saving…</span>
    </span>
  ) : (
    <>
      {iconLeft && <span className={styles.iconSlot}>{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className={styles.iconSlot}>{iconRight}</span>}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={combinedClass}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={combinedClass}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}
