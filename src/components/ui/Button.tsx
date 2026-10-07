import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  href?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  href,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const combinedClass = `${styles.btn} ${styles[variant]} ${styles[size]} ${className}`;

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={combinedClass}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingWrapper}>
          <span className={styles.spinner} aria-hidden="true" />
          <span>Saving…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
