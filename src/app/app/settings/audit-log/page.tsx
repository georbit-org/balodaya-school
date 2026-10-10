'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';

interface AuditRecord {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  detail: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/audit-log')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setLogs(data.items);
      })
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = filterAction
    ? logs.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()))
    : logs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <PageHeader
        title="Institutional Audit Trail"
        description="Immutable record of security events, grade adjustments, fee collections, and administrative changes."
        actions={
          <Button variant="secondary" iconLeft={<Icon name="refresh" size={16} />} onClick={fetchLogs}>
            Refresh
          </Button>
        }
      />

      <Section title="Activity Logs" description={`Showing ${filtered.length} audit event(s)`}>
        {loading ? (
          <Skeleton variant="tableRows" rows={6} />
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: 0, padding: 'var(--sp-4) 0' }}>
            No audit records logged yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink-faint)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  <th style={{ padding: '8px 12px' }}>Operator</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                  <th style={{ padding: '8px 12px' }}>Entity</th>
                  <th style={{ padding: '8px 12px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const isDanger = log.action.includes('DELETE') || log.action.includes('VOID') || log.action.includes('FAIL');
                  const isSuccess = log.action.includes('CREATE') || log.action.includes('PAYMENT') || log.action.includes('PUBLISH');

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>
                        {log.created_at}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--ink)' }}>
                        {log.user_name || (log.user_id ? `User #${log.user_id}` : 'System / Guest')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge variant={isDanger ? 'danger' : isSuccess ? 'success' : 'info'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                        {log.entity ? `${log.entity}${log.entity_id ? ` #${log.entity_id}` : ''}` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink)' }}>
                        {log.detail || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
