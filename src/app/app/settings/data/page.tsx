'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { BackupFileInfo } from '@/server/backup';
import styles from './page.module.css';

export default function DataAndBackupsPage() {
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data');
      if (!res.ok) throw new Error('Failed to load backup archive');
      const data = await res.json();
      setBackups(data.backups || []);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading database backup files.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_backup' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create backup');

      setStatusMsg({ type: 'success', text: `Snapshot ${data.backup.filename} created!` });
      fetchBackups();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Backup failed',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoringFile) return;
    if (confirmationInput !== 'RESTORE-BALODAYA-DATABASE') {
      alert('Confirmation phrase does not match.');
      return;
    }

    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_backup',
          filename: restoringFile,
          confirmation: confirmationInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      setRestoringFile(null);
      setConfirmationInput('');
      setStatusMsg({ type: 'success', text: `Database successfully restored from ${restoringFile}!` });
      fetchBackups();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Data Exports & Database Vault"
        description="One-click full SQLite database snapshots, downloadable tabular CSV/JSON data exports for every school module, and guarded point-in-time database restoration."
        actions={
          <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
            ← Settings Center
          </Link>
        }
      />

      {statusMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Backup Vault */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Database Snapshots</h3>
            <Button variant="primary" onClick={handleCreateBackup} disabled={creating}>
              {creating ? <Spinner size="sm" /> : '+ Take Snapshot Now'}
            </Button>
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Live point-in-time snapshots of the database stored safely on the server.
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Backup File</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                    No snapshots created yet. Click above to take one!
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.filename}>
                    <td>
                      <strong style={{ fontSize: '0.8125rem', display: 'block' }}>{b.filename}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>{formatSize(b.sizeBytes)}</td>
                    <td>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b91c1c',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                        onClick={() => {
                          setRestoringFile(b.filename);
                          setConfirmationInput('');
                        }}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Data Exports */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Tabular Data Exports</h3>
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Download complete records in CSV or JSON for government reporting, auditing, or spreadsheets.
          </div>

          <div className={styles.exportList}>
            {[
              { id: 'students', label: 'Student Directory', sub: 'Bio, Roll, Class, Section, Guardian contacts' },
              { id: 'staff', label: 'Staff & Teachers Roster', sub: 'Account names, roles, phone numbers, designations' },
              { id: 'fees', label: 'Payments & Fee Receipts', sub: 'Recent invoice settlements, receipt numbers, payment modes' },
              { id: 'attendance', label: 'Daily Attendance Log', sub: 'Past student attendance marks and daily statuses' },
            ].map((m) => (
              <div key={m.id} className={styles.exportItem}>
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>{m.label}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.sub}</div>
                </div>
                <div className={styles.btnGroup}>
                  <a
                    href={`/api/admin/data?action=export&module=${m.id}&format=csv`}
                    download
                    className="button secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    CSV
                  </a>
                  <a
                    href={`/api/admin/data?action=export&module=${m.id}&format=json`}
                    download
                    className="button secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    JSON
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {restoringFile && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <h3 style={{ margin: 0, color: '#991b1b' }}>Confirm Database Restoration</h3>
            <div className={styles.dangerAlert}>
              <strong>Warning:</strong> Restoring database will replace all current tables and records with the state from snapshot <code>{restoringFile}</code>. This action cannot be undone.
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Type &quot;RESTORE-BALODAYA-DATABASE&quot; to proceed:
              </label>
              <input
                className={styles.input}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="RESTORE-BALODAYA-DATABASE"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setRestoringFile(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={confirmationInput !== 'RESTORE-BALODAYA-DATABASE'}
                onClick={handleExecuteRestore}
              >
                Proceed with Restore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
