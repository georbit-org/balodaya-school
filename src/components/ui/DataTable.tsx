'use client';

import React, { useState } from 'react';
import { Skeleton } from './Skeleton';
import { Icon } from './Icon';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

export type TableDensity = 'compact' | 'default' | 'relaxed';

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPage?: (newPage: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  // Interactive features
  title?: string;
  toolbarActions?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  renderCard?: (row: T) => React.ReactNode;
}

export function DataTable<T extends object>({
  columns,
  rows,
  loading = false,
  emptyText = 'No records found.',
  emptyTitle = 'No Records',
  emptyAction,
  page,
  pageSize,
  total,
  onPage,
  keyExtractor,
  title,
  toolbarActions,
  searchQuery,
  onSearchChange,
  sortColumn: externalSortCol,
  sortDirection: externalSortDir,
  onSort,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  density: externalDensity,
  onDensityChange,
  renderCard,
}: DataTableProps<T>) {
  const [internalDensity, setInternalDensity] = useState<TableDensity>('default');
  const [internalSortCol, setInternalSortCol] = useState<string | undefined>(undefined);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');

  const density = externalDensity || internalDensity;
  const sortCol = externalSortCol !== undefined ? externalSortCol : internalSortCol;
  const sortDir = externalSortDir !== undefined ? externalSortDir : internalSortDir;

  const handleDensityToggle = () => {
    const next: TableDensity =
      density === 'default' ? 'compact' : density === 'compact' ? 'relaxed' : 'default';
    if (onDensityChange) onDensityChange(next);
    else setInternalDensity(next);
  };

  const handleSortClick = (key: string) => {
    const nextDir = sortCol === key && sortDir === 'asc' ? 'desc' : 'asc';
    if (onSort) {
      onSort(key, nextDir);
    } else {
      setInternalSortCol(key);
      setInternalSortDir(nextDir);
    }
  };

  const getRowKey = (row: T, idx: number): string | number => {
    if (keyExtractor) return keyExtractor(row, idx);
    const candidate = (row as Record<string, unknown>).id;
    if (typeof candidate === 'string' || typeof candidate === 'number') return candidate;
    return idx;
  };

  const allRowKeys = rows.map((r, i) => getRowKey(r, i));
  const isAllSelected =
    rows.length > 0 && allRowKeys.every((k) => selectedKeys.has(k));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allRowKeys));
    }
  };

  const toggleSelectRow = (key: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  // Client-side sorting fallback when no server onSort is provided
  let displayedRows = [...rows];
  if (!onSort && sortCol) {
    displayedRows.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortCol];
      const valB = (b as Record<string, unknown>)[sortCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 1;

  return (
    <div className={`${styles.wrapper} ${styles[density]}`}>
      {/* Table Toolbar if title, search, density, or actions exist */}
      {(title || onSearchChange || toolbarActions) && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {title && <h3 className={styles.tableTitle}>{title}</h3>}
            {onSearchChange && (
              <div className={styles.searchWrapper}>
                <Icon name="search" width={14} height={14} color="var(--ink-soft)" />
                <input
                  type="search"
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Filter roster records…"
                  className={styles.searchInput}
                />
              </div>
            )}
          </div>
          <div className={styles.toolbarRight}>
            <button
              type="button"
              onClick={handleDensityToggle}
              className={styles.toolBtn}
              title={`Density: ${density}. Click to toggle`}
            >
              Density: <strong style={{ textTransform: 'capitalize' }}>{density}</strong>
            </button>
            {toolbarActions}
          </div>
        </div>
      )}

      {/* Floating Selection Bar */}
      {selectable && selectedKeys.size > 0 && (
        <div className={styles.selectionBar}>
          <span>
            <strong>{selectedKeys.size}</strong> item(s) selected
          </span>
          <button
            type="button"
            onClick={() => onSelectionChange && onSelectionChange(new Set())}
            className={styles.selectionClearBtn}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Desktop / Tablet Scroll Area */}
      <div className={styles.scrollArea}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {selectable && (
                <th className={`${styles.th} ${styles.checkboxTh}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                    className={styles.checkbox}
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className={`${styles.th} ${col.sortable ? styles.sortableTh : ''}`}
                    onClick={() => col.sortable && handleSortClick(col.key)}
                  >
                    <div className={styles.thContent} style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      <span>{col.header ?? col.label ?? ''}</span>
                      {col.sortable && (
                        <span className={`${styles.sortIcon} ${isSorted ? styles.sorted : ''}`}>
                          {isSorted ? (
                            sortDir === 'asc' ? '▲' : '▼'
                          ) : (
                            '⇅'
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className={styles.tr}>
                  {selectable && (
                    <td className={styles.td}>
                      <Skeleton width={16} height={16} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      <Skeleton width="80%" height={14} />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    <Icon name="search" width={28} height={28} color="var(--ink-muted)" />
                    <h4 className={styles.emptyTitle}>{emptyTitle}</h4>
                    <p className={styles.emptyText}>{emptyText}</p>
                    {emptyAction && <div className={styles.emptyAction}>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              displayedRows.map((row, idx) => {
                const rowKey = getRowKey(row, idx);
                const isSelected = selectedKeys.has(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className={`${styles.tr} ${isSelected ? styles.selectedRow : ''}`}
                  >
                    {selectable && (
                      <td className={`${styles.td} ${styles.checkboxTd}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowKey)}
                          aria-label={`Select row ${idx + 1}`}
                          className={styles.checkbox}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                        className={styles.td}
                      >
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total !== undefined && pageSize !== undefined && page !== undefined && total > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> entries
          </span>
          <div className={styles.pageControls}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => onPage && onPage(page - 1)}
            >
              Previous
            </button>
            <span className={styles.pageNumber}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => onPage && onPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
