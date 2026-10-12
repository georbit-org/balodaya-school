'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { TemplateRecord } from '@/server/templates';
import styles from './page.module.css';

const SAMPLE_VARS: Record<string, string | number> = {
  student: 'Aarav Shrestha',
  class: 'Class 9-A',
  roll: 12,
  year: '2083',
  guardian: 'Ram Shrestha',
  amount: '4,500',
  date: '2083-07-15',
  from_date: '2083-07-10',
  to_date: '2083-07-12',
  due_date: '2083-07-30',
  name: 'Sunita Sharma',
  username: 'sunita.teacher',
  receipt_no: 'RCP-2083-00124',
};

const COMMON_PLACEHOLDERS = [
  '{student}',
  '{class}',
  '{roll}',
  '{year}',
  '{guardian}',
  '{amount}',
  '{date}',
  '{due_date}',
  '{from_date}',
  '{to_date}',
  '{receipt_no}',
];

function renderPreview(text: string): string {
  let res = text;
  for (const [k, v] of Object.entries(SAMPLE_VARS)) {
    res = res.replaceAll(`{${k}}`, String(v));
  }
  return res;
}

export default function TemplatesManagerPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      const data: TemplateRecord[] = await res.json();
      setTemplates(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading communication & print templates.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleChange = (key: string, field: 'subject' | 'body_en' | 'body_ne', val: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: val } : t))
    );
  };

  const handleInsertVar = (key: string, placeholder: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.key !== key) return t;
        return {
          ...t,
          body_en: `${t.body_en} ${placeholder}`,
        };
      })
    );
  };

  const handleSave = async (tpl: TemplateRecord) => {
    setSavingKey(tpl.key);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tpl),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save template');
      }

      setStatusMsg({ type: 'success', text: `Saved template "${tpl.subject || tpl.key}" successfully!` });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const filtered = filter === 'all'
    ? templates
    : templates.filter((t) => t.kind === filter);

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
        title="Communication & Document Templates"
        description="Configure standard wording for SMS notifications, receipt footnotes, character & bonafide certificates, marksheet remarks, and welcome emails."
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

      <div className={styles.filterBar}>
        {['all', 'sms', 'receipt', 'certificate', 'marksheet', 'email'].map((k) => (
          <button
            key={k}
            type="button"
            className={`${styles.filterBtn} ${filter === k ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(k)}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.cardGrid}>
        {filtered.map((tpl) => (
          <div key={tpl.key} className={styles.templateCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.kindBadge}>{tpl.kind}</span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                  {tpl.subject || tpl.key}
                </h3>
                <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{tpl.key}</code>
              </div>
            </div>

            <div className={styles.chipBar}>
              <span>Insert placeholder:</span>
              {COMMON_PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  className={styles.varChip}
                  onClick={() => handleInsertVar(tpl.key, ph)}
                >
                  {ph}
                </button>
              ))}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>English Content (Required)</label>
                <textarea
                  className={styles.textarea}
                  value={tpl.body_en}
                  onChange={(e) => handleChange(tpl.key, 'body_en', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Nepali Content (Optional)</label>
                <textarea
                  className={styles.textarea}
                  value={tpl.body_ne || ''}
                  onChange={(e) => handleChange(tpl.key, 'body_ne', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewTitle}>Live Preview (Sample Student Aarav Shrestha)</div>
              <div>{renderPreview(tpl.body_en)}</div>
              {tpl.body_ne && (
                <div style={{ marginTop: '6px', color: '#475569' }}>
                  {renderPreview(tpl.body_ne)}
                </div>
              )}
            </div>

            <div className={styles.cardFooter}>
              <Button
                variant="primary"
                onClick={() => handleSave(tpl)}
                disabled={savingKey === tpl.key}
              >
                {savingKey === tpl.key ? <Spinner size="sm" /> : 'Save Template'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
