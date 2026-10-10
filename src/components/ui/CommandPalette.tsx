'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, IconName } from './Icon';
import { KeyHint } from './KeyHint';
import styles from './CommandPalette.module.css';

interface SearchItem {
  id: string | number;
  title: string;
  subtitle?: string;
  href: string;
  category: 'pages' | 'students' | 'staff' | 'notices' | 'actions';
  badge?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (active && data.items) {
            setItems(data.items);
            setSelectedIndex(0);
          }
        })
        .catch(() => {
          // ignore abort
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query ? 180 : 0);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      }
    }
  };

  if (!open) return null;

  const getCategoryIcon = (category: SearchItem['category']): IconName => {
    switch (category) {
      case 'students':
        return 'students';
      case 'staff':
        return 'staff';
      case 'notices':
        return 'notices';
      case 'actions':
        return 'star';
      default:
        return 'dashboard';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command search palette"
      >
        <div className={styles.inputRow}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Icon name="search" size={18} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search students, staff, circulars, or jump to page…"
            className={styles.input}
            aria-autocomplete="list"
          />
          <KeyHint>ESC</KeyHint>
        </div>

        <ul className={styles.resultsList} role="listbox">
          {loading && items.length === 0 ? (
            <li className={styles.emptyState}>Searching records…</li>
          ) : items.length === 0 ? (
            <li className={styles.emptyState}>No results found for &ldquo;{query}&rdquo;</li>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={`${item.category}-${item.id}`}
                  className={`${styles.item} ${isSelected ? styles.itemActive : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.itemIcon} aria-hidden="true">
                      <Icon name={getCategoryIcon(item.category)} size={16} />
                    </span>
                    <div className={styles.itemTexts}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.subtitle && (
                        <span className={styles.itemSubtitle}>{item.subtitle}</span>
                      )}
                    </div>
                  </div>
                  {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                </li>
              );
            })
          )}
        </ul>

        <div className={styles.footer}>
          <div className={styles.footerShortcuts}>
            <span className={styles.shortcut}>
              <KeyHint>&uarr;</KeyHint>
              <KeyHint>&darr;</KeyHint> to navigate
            </span>
            <span className={styles.shortcut}>
              <KeyHint>&crarr;</KeyHint> to select
            </span>
          </div>
          <span>Balodaya Command Hub</span>
        </div>
      </div>
    </div>
  );
}
