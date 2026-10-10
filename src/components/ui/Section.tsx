import React from 'react';
import styles from './Section.module.css';

interface SectionProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function Section({
  title,
  description,
  actions,
  flush = false,
  children,
  className,
  headerClassName,
  bodyClassName,
}: SectionProps) {
  return (
    <section className={`${styles.section} ${className || ''}`}>
      <div className={`${styles.header} ${headerClassName || ''}`}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div
        className={`${flush ? styles.bodyFlush : styles.body} ${bodyClassName || ''}`}
      >
        {children}
      </div>
    </section>
  );
}
