'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Tenders.module.css';

interface TenderItem {
  id: number;
  title: string;
  description: string | null;
  file_path: string | null;
  deadline: string | null;
  published: number;
  created_at: string;
}

export default function TendersManagementPage() {
  const [tenders, setTenders] = useState<TenderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    file_path: '',
    deadline: '',
    published: true,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenders');
      if (res.ok) {
        const d = await res.json();
        setTenders(d.tenders || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenders();
  }, [loadTenders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      let finalPath = form.file_path;

      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        const upRes = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || 'Failed to upload tender document');
        finalPath = upData.file_path;
      }

      const url = editId ? `/api/tenders/${editId}` : '/api/tenders';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          file_path: finalPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save tender');

      setIsDialogOpen(false);
      setEditId(null);
      setForm({ title: '', description: '', file_path: '', deadline: '', published: true });
      setUploadFile(null);
      loadTenders();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving tender');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (t: TenderItem) => {
    try {
      const res = await fetch(`/api/tenders/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: t.published ? 0 : 1 }),
      });
      if (res.ok) loadTenders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tender?')) return;
    try {
      const res = await fetch(`/api/tenders/${id}`, { method: 'DELETE' });
      if (res.ok) loadTenders();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<TenderItem>[] = [
    {
      key: 'title',
      label: 'Tender Title & Scope',
      render: (t) => (
        <div>
          <div><strong>{t.title}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>{t.description?.slice(0, 90) || 'No description'}</small>
        </div>
      ),
    },
    { key: 'deadline', label: 'Deadline', render: (t) => t.deadline || 'Open until notice' },
    {
      key: 'file_path',
      label: 'Document / Specifications',
      render: (t) =>
        t.file_path ? (
          <a
            href={t.file_path.startsWith('/') ? t.file_path : `/${t.file_path}`}
            target="_blank"
            rel="noreferrer"
            download
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            Download PDF &darr;
          </a>
        ) : (
          <span style={{ color: 'var(--ink-soft)' }}>None</span>
        ),
    },
    {
      key: 'published',
      label: 'Status',
      render: (t) => (
        <span style={{ fontWeight: 600, color: t.published ? 'var(--accent)' : 'var(--ink-soft)' }}>
          {t.published ? 'Published' : 'Archived / Hidden'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (t) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditId(t.id);
              setForm({
                title: t.title,
                description: t.description || '',
                file_path: t.file_path || '',
                deadline: t.deadline || '',
                published: Boolean(t.published),
              });
              setFormError('');
              setIsDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(t)}>
            {t.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleDelete(t.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Procurement & Tenders"
        description="Public tenders, civil construction bids, and equipment procurement notices."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditId(null);
              setForm({ title: '', description: '', file_path: '', deadline: '', published: true });
              setFormError('');
              setIsDialogOpen(true);
            }}
          >
            + Add Tender Notice
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={tenders}
        loading={loading}
        emptyText="No tender notices currently registered."
      />

      {/* Add / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editId ? 'Edit Tender Notice' : 'Post New Tender Notice'}
      >
        <form onSubmit={handleSubmit} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <Field label="Tender Title *" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Tender Notice 114: Construction of Smart Science Laboratory"
            />
          </Field>

          <Field label="Submission Deadline">
            <input
              type="text"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              placeholder="e.g. 2083 Jestha 10, 5:00 PM"
            />
          </Field>

          <Field label="Description & Terms of Reference">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Sealed quotations invited from eligible contractors for furnishing and fitting."
            />
          </Field>

          <Field label="Upload Tender Document / PDF">
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
            />
          </Field>

          <Field label="Or Document File Path">
            <input
              type="text"
              value={form.file_path}
              onChange={(e) => setForm({ ...form, file_path: e.target.value })}
              placeholder="e.g. /assets/images/tender/1702378989-111.pdf"
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publish on public Tenders page
          </label>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Tender'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
