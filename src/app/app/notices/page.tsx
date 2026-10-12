'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { useSession } from '@/components/auth/SessionProvider';
import styles from './Notices.module.css';

interface NoticeItem {
  id: number;
  title: string;
  body: string;
  kind: 'notice' | 'event';
  audience: 'public' | 'staff' | 'parents' | 'students';
  event_date: string | null;
  attachment_path: string | null;
  published: number;
  created_at: string;
  author_name: string | null;
}

export default function NoticesManagementPage() {
  const { user, can } = useSession();
  const canCreate = can('notice.create_scope') || can('notice.create_all');
  const isTeacher = user?.role === 'teacher';
  const isAdminOrPrincipal = user?.role === 'admin' || user?.role === 'principal';

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');

  // Read Notice Dialog State
  const [readNotice, setReadNotice] = useState<NoticeItem | null>(null);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    kind: 'notice' as 'notice' | 'event',
    audience: 'public' as 'public' | 'staff' | 'parents' | 'students',
    event_date: '',
    published: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kindFilter) params.set('kind', kindFilter);
      if (audienceFilter) params.set('audience', audienceFilter);

      const res = await fetch(`/api/notices?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setNotices(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [kindFilter, audienceFilter]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      title: '',
      body: '',
      kind: 'notice',
      audience: 'public',
      event_date: '',
      published: true,
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleOpenEdit = (item: NoticeItem) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      body: item.body,
      kind: item.kind,
      audience: item.audience,
      event_date: item.event_date || '',
      published: Boolean(item.published),
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editId ? `/api/notices/${editId}` : '/api/notices';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          event_date: form.event_date || null,
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setIsOpen(false);
        loadNotices();
      } else {
        setFormError(d.error || 'Failed to save notice.');
      }
    } catch {
      setFormError('Network error saving notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: NoticeItem) => {
    const nextVal = item.published ? 0 : 1;
    await fetch(`/api/notices/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: nextVal }),
    });
    loadNotices();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this notice?')) return;
    await fetch(`/api/notices/${id}`, { method: 'DELETE' });
    loadNotices();
  };

  const columns: Column<NoticeItem>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item: NoticeItem) => (
        <div>
          <strong
            style={{ cursor: 'pointer', color: 'var(--primary, #094067)' }}
            onClick={() => setReadNotice(item)}
          >
            {item.title}
          </strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            Posted on {item.created_at.slice(0, 10)} {item.author_name ? `by ${item.author_name}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Category',
      render: (item: NoticeItem) =>
        item.kind === 'event' ? (
          <span className={styles.badgeEvent}>Event</span>
        ) : (
          <span className={styles.badgeNotice}>Notice</span>
        ),
    },
    ...(isAdminOrPrincipal
      ? [
          {
            key: 'audience',
            header: 'Audience',
            render: (item: NoticeItem) => <span className={styles.badgeAudience}>{item.audience}</span>,
          },
        ]
      : []),
    {
      key: 'event_date',
      header: 'Event Date',
      render: (item: NoticeItem) => item.event_date || '—',
    },
    ...(isAdminOrPrincipal || isTeacher
      ? [
          {
            key: 'status',
            header: 'Status',
            render: (item: NoticeItem) =>
              item.published ? (
                <span className={styles.badgePublished}>Published</span>
              ) : (
                <span className={styles.badgeDraft}>Draft</span>
              ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Actions',
      render: (item: NoticeItem) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" size="sm" onClick={() => setReadNotice(item)}>
            Read
          </Button>
          {canCreate && (isAdminOrPrincipal || item.author_name === user?.name) && (
            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(item)}>
              Edit
            </Button>
          )}
          {isAdminOrPrincipal && (
            <>
              <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(item)}>
                {item.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(item.id)}>
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Notice Board & Circulars"
        description="Institutional announcements, academic calendar events, and audience-targeted circulars."
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleOpenCreate}>
              + Post New Notice
            </Button>
          ) : undefined
        }
      />

      <div className={styles.filterBar}>
        <select
          className={styles.selectInput}
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
        >
          <option value="">All Types (Notices & Events)</option>
          <option value="notice">Notices Only</option>
          <option value="event">Events Only</option>
        </select>

        {isAdminOrPrincipal && (
          <select
            className={styles.selectInput}
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
          >
            <option value="">All Audiences</option>
            <option value="public">Public</option>
            <option value="staff">Staff Only</option>
            <option value="parents">Parents Only</option>
            <option value="students">Students Only</option>
          </select>
        )}
      </div>

      <DataTable<NoticeItem>
        columns={columns}
        rows={notices}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyText="No notices found."
      />

      {/* Read Notice Modal */}
      <Dialog
        open={readNotice !== null}
        onClose={() => setReadNotice(null)}
        title={readNotice?.title || 'Notice Details'}
      >
        {readNotice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span className={readNotice.kind === 'event' ? styles.badgeEvent : styles.badgeNotice}>
                {readNotice.kind === 'event' ? 'Calendar Event' : 'Notice'}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                Posted on {readNotice.created_at.slice(0, 10)} {readNotice.author_name ? `by ${readNotice.author_name}` : ''}
              </span>
            </div>

            {readNotice.event_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                <Icon name="calendar" size={14} />
                <span><strong>Scheduled Date:</strong> {readNotice.event_date}</span>
              </div>
            )}

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--ink)' }}>
              {readNotice.body}
            </div>

            {readNotice.attachment_path && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <a href={readNotice.attachment_path} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">Download Attachment</Button>
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setReadNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editId ? 'Edit School Notice' : 'Post New School Notice'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {formError && (
            <div style={{ padding: 'var(--space-2)', background: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: 'var(--text-sm)' }}>
              {formError}
            </div>
          )}

          <Field
            label="Notice Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. First Terminal Examination Schedule Announcement"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field
              label="Type *"
              as="select"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as 'notice' | 'event' })}
              required
            >
              <option value="notice">Notice</option>
              <option value="event">Event</option>
            </Field>

            <Field
              label="Target Audience *"
              as="select"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value as 'public' | 'staff' | 'parents' | 'students' })}
              required
            >
              <option value="public">Public (Visible on Website)</option>
              <option value="staff">Staff / Faculty Only</option>
              <option value="parents">Parents Only</option>
              <option value="students">Students Only</option>
            </Field>
          </div>

          <Field
            label="Event Date (If applicable)"
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />

          <Field
            label="Notice Content *"
            as="textarea"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Type notice message (paragraphs separated by blank lines)..."
            required
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publish immediately (make visible to target audience)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editId ? 'Update Notice' : 'Post Notice'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
