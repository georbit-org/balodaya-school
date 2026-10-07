'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Messages.module.css';

interface MessageItem {
  id: number;
  kind: 'contact' | 'transfer-certificate' | 'testimonial' | 'alumni';
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  body: string;
  extra: string | null;
  status: 'new' | 'read' | 'done' | 'published' | 'hidden';
  created_at: string;
}

export default function MessagesManagementPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'transfer-certificate' | 'testimonial' | 'alumni'>('contact');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?kind=${activeTab}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages || []);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message record?')) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (res.ok) loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<MessageItem>[] = [
    {
      key: 'name',
      label: 'Sender',
      render: (m) => (
        <div>
          <div><strong>{m.name}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>
            {m.phone || 'No phone'} {m.email ? `• ${m.email}` : ''}
          </small>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject / Scope',
      render: (m) => {
        if (m.kind === 'transfer-certificate') {
          let extraObj: { admissionNo?: string; classLevel?: string } = {};
          try {
            extraObj = JSON.parse(m.extra || '{}');
          } catch {}
          return (
            <div>
              <div><strong>Transfer Certificate</strong></div>
              <small style={{ color: 'var(--ink-soft)' }}>
                Adm: {extraObj.admissionNo || '—'} • Class: {extraObj.classLevel || '—'}
              </small>
            </div>
          );
        }
        if (m.kind === 'testimonial') {
          let role = 'Community Member';
          try {
            const p = JSON.parse(m.extra || '{}');
            if (p.role) role = p.role;
          } catch {}
          return <span>Testimonial ({role})</span>;
        }
        if (m.kind === 'alumni') {
          let batch = 'Alumnus';
          try {
            const p = JSON.parse(m.extra || '{}');
            if (p.batchYear) batch = `Batch of ${p.batchYear}`;
          } catch {}
          return <span>Alumni Note ({batch})</span>;
        }
        return <span>{m.subject || 'General Inquiry'}</span>;
      },
    },
    {
      key: 'body',
      label: 'Message Content',
      render: (m) => (
        <div style={{ maxWidth: '400px', whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--ink)' }}>
          {m.body}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Received On',
      render: (m) => m.created_at?.slice(0, 10) || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (m) => {
        const isPublicKind = m.kind === 'testimonial' || m.kind === 'alumni';
        const options = isPublicKind
          ? [
              { value: 'new', label: 'New / Review' },
              { value: 'published', label: 'Published' },
              { value: 'hidden', label: 'Hidden / Rejected' },
            ]
          : [
              { value: 'new', label: 'New' },
              { value: 'read', label: 'Under Review' },
              { value: 'done', label: 'Resolved / Done' },
            ];

        return (
          <select
            value={m.status}
            onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid var(--border)',
            }}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (m) => (
        <Button variant="secondary" size="sm" onClick={() => handleDelete(m.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Incoming Inquiries & Messages"
        description="Public contact messages, Transfer Certificate requests, parent testimonials, and alumni submissions."
      />

      <div className={styles.tabList} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeTab === 'contact' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          General Contact Inquiries
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'transfer-certificate' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('transfer-certificate')}
        >
          TC Requests
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'testimonial' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('testimonial')}
        >
          Testimonials (CMS)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'alumni' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('alumni')}
        >
          Alumni Voices (CMS)
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={messages}
        loading={loading}
        emptyText={`No ${activeTab} messages currently recorded.`}
      />
    </div>
  );
}
