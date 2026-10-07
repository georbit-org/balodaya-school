import React from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title?: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No records found',
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`${styles.box} ${className}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
