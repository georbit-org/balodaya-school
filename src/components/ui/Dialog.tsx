'use client';

import React, { useEffect, useRef, useId } from 'react';
import { Icon } from './Icon';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Dialog({ open, onClose, title, children, width }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Only focus dialog container if focus is not already inside it
    if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Focus trap for Tab
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        style={{ maxWidth: width || '560px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className={styles.header}>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
