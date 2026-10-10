import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.textColumn}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className={styles.crumbs} />}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
