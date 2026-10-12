'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { LabelRow } from '@/app/api/admin/labels/route';

export default function LabelsManagerPage() {
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/labels');
      if (!res.ok) throw new Error('Failed to load labels');
      const data: LabelRow[] = await res.json();
      setLabels(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading vocabulary labels.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleChange = (key: string, field: 'en' | 'ne', value: string) => {
    setLabels((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async (item: LabelRow) => {
    setSavingKey(item.key);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/labels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!res.ok) throw new Error('Failed to save label');

      setStatusMsg({ type: 'success', text: `Saved "${item.en}" successfully!` });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <PageHeader
        title="Vocabulary & Terminology Labels"
        description="Customize school management terminology. Rename terms like Class → Grade, Section → Group, or update Nepali translations."
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

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Group / Context</th>
              <th style={{ padding: '12px 16px' }}>English Term</th>
              <th style={{ padding: '12px 16px' }}>Nepali Term</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((item) => (
              <tr key={item.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{item.group_name || 'General'}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <code>{item.key}</code>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <input
                    type="text"
                    value={item.en}
                    onChange={(e) => handleChange(item.key, 'en', e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                  />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <input
                    type="text"
                    value={item.ne || ''}
                    onChange={(e) => handleChange(item.key, 'ne', e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                  />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => handleSave(item)}
                    disabled={savingKey === item.key}
                  >
                    {savingKey === item.key ? <Spinner size="sm" /> : 'Save'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
