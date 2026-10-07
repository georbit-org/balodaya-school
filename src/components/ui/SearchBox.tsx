'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import styles from './SearchBox.module.css';

export interface SearchBoxProps {
  placeholder?: string;
  queryParam?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export function SearchBox({
  placeholder = 'Search…',
  queryParam = 'q',
  onSearch,
  className = '',
}: SearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialValue = searchParams.get(queryParam) || '';

  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      } else {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          params.set(queryParam, value.trim());
        } else {
          params.delete(queryParam);
        }
        params.delete('page'); // reset pagination on search
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, pathname, queryParam, searchParams, router, onSearch]);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        aria-label={placeholder}
      />
    </div>
  );
}
