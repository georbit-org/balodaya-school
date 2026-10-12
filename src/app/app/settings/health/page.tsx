'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import type { DiagnosticIssue } from '@/server/health';
import styles from './page.module.css';

interface HealthData {
  healthy: boolean;
  score: number;
  issues: DiagnosticIssue[];
  stats: {
    totalStudents: number;
    totalStaff: number;
    activePages: number;
    backupsCount: number;
  };
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/health');
      if (!res.ok) throw new Error('Failed to run system diagnostics');
      const json = await res.json();
      setData(json);
    } catch {
      setError('Error conducting health check.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <PageHeader title="System Health & Misconfiguration Audit" />
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error || 'Unable to scan system status.'}
        </div>
        <Button onClick={fetchHealth}>Retry Scan</Button>
      </div>
    );
  }

  const scoreColor = data.score >= 85 ? '#15803d' : data.score >= 65 ? '#d97706' : '#b91c1c';
  const scoreBg = data.score >= 85 ? '#dcfce7' : data.score >= 65 ? '#fef3c7' : '#fee2e2';

  return (
    <div className={styles.container}>
      <PageHeader
        title="System Health & Configuration Audit"
        description="Live diagnostics scanning for unassigned class teachers, empty timetables, orphan fee categories, backup freshness, and WCAG accessibility compliance."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={fetchHealth}>
              ↻ Re-run Scan
            </Button>
            <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
              ← Settings
            </Link>
          </div>
        }
      />

      {/* Score Banner */}
      <div className={styles.scoreBanner}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.25rem' }}>
            {data.score >= 85 ? 'System is in Optimal Health' : 'Configuration Attention Needed'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
            {data.issues.length === 0
              ? 'All classes have teachers, timetables are populated, backups are up to date, and media accessibility rules pass.'
              : `Found ${data.issues.length} diagnostic items to optimize school operations.`}
          </p>
        </div>
        <div
          className={styles.scoreCircle}
          style={{ background: scoreBg, color: scoreColor }}
        >
          {data.score}
          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Students</span>
          <strong style={{ fontSize: '1.25rem' }}>{data.stats.totalStudents}</strong>
        </div>
        <div className={styles.statCard}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Staff & Teachers</span>
          <strong style={{ fontSize: '1.25rem' }}>{data.stats.totalStaff}</strong>
        </div>
        <div className={styles.statCard}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Published CMS Pages</span>
          <strong style={{ fontSize: '1.25rem' }}>{data.stats.activePages}</strong>
        </div>
        <div className={styles.statCard}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Database Snapshots</span>
          <strong style={{ fontSize: '1.25rem' }}>{data.stats.backupsCount}</strong>
        </div>
      </div>

      {/* Issue Items */}
      <div className={styles.issueList}>
        <h3 style={{ margin: '8px 0 0 0', fontSize: '1.05rem' }}>
          Diagnostic Findings ({data.issues.length})
        </h3>

        {data.issues.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              color: '#15803d',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Icon name="check-circle" size={28} />
            <span style={{ fontWeight: 600 }}>No misconfigurations or operational bottlenecks detected!</span>
          </div>
        ) : (
          data.issues.map((iss) => {
            const badgeBg =
              iss.severity === 'error' ? '#fee2e2' : iss.severity === 'warning' ? '#fef3c7' : '#e0f2fe';
            const badgeColor =
              iss.severity === 'error' ? '#991b1b' : iss.severity === 'warning' ? '#92400e' : '#0369a1';

            return (
              <div key={iss.id} className={styles.issueCard}>
                <div>
                  <span className={styles.badge} style={{ background: badgeBg, color: badgeColor }}>
                    {iss.severity}: {iss.category}
                  </span>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem' }}>{iss.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.4 }}>
                    {iss.description}
                  </p>
                </div>
                <Link
                  href={iss.fixUrl}
                  className="button primary"
                  style={{ textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
                >
                  {iss.fixActionLabel} →
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
