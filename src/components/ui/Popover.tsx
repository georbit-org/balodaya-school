'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Popover.module.css';

interface PopoverProps {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}

export function Popover({
  trigger,
  children,
  align = 'right',
  className,
  panelClassName,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className || ''}`}>
      <div onClick={toggle} className={styles.trigger} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`${styles.panel} ${align === 'right' ? styles.panelRight : styles.panelLeft} ${
            panelClassName || ''
          }`}
          role="region"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
