import React from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPage?: (newPage: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
}

export function DataTable<T extends object>({
  columns,
  rows,
  loading = false,
  emptyText = 'No records found.',
  page,
  pageSize,
  total,
  onPage,
  keyExtractor,
}: DataTableProps<T>) {
  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 1;

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={styles.th}
                >
                  {col.header ?? col.label ?? ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingCell}>
                  Loading data…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const rowKey = keyExtractor ? keyExtractor(row, idx) : idx;
                return (
                  <tr key={rowKey} className={styles.tr}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                        className={styles.td}
                      >
                        {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total !== undefined && pageSize !== undefined && page !== undefined && total > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className={styles.pageControls}>
            <button
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
