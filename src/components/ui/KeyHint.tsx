import React from 'react';
import styles from './KeyHint.module.css';

interface KeyHintProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyHint({ children, className }: KeyHintProps) {
  return <kbd className={`${styles.kbd} ${className || ''}`}>{children}</kbd>;
}
