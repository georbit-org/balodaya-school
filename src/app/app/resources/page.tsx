'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useSession } from '@/components/auth/SessionProvider';
import styles from './Resources.module.css';

interface ResourceItem {
  id: number;
  kind: 'question-bank' | 'exam-portion' | 'policy' | 'other';
  title: string;
  class_id: number | null;
  subject_id: number | null;
  file_path: string;
  published: number;
  created_at: string;
  class_name: string | null;
  subject_name: string | null;
  uploaded_by_name: string | null;
}

interface ClassOption {
  id: number;
  name: string;
}

interface SubjectOption {
  id: number;
  name: string;
}

export default function ResourcesManagementPage() {
  const { can } = useSession();
  const canManage = can('resource.manage');

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    kind: 'question-bank',
    title: '',
    class_id: '',
    subject_id: '',
    file_path: '',
    published: true,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeKind !== 'all') params.set('kind', activeKind);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setResources(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [activeKind, searchQuery]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => setClasses(d.classes || []))
      .catch(() => {});

    fetch('/api/subjects')
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      let finalPath = form.file_path;

      // Handle file upload if provided
      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        const upRes = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || 'Failed to upload document');
        finalPath = upData.file_path;
      }

      if (!finalPath?.trim()) {
        throw new Error('Please select a file to upload or enter a document path.');
      }

      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          file_path: finalPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create resource');

      setIsDialogOpen(false);
      setForm({
        kind: 'question-bank',
        title: '',
        class_id: '',
        subject_id: '',
        file_path: '',
        published: true,
      });
      setUploadFile(null);
      loadResources();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: ResourceItem) => {
    try {
      const res = await fetch(`/api/resources/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: item.published ? 0 : 1 }),
      });
      if (res.ok) loadResources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) loadResources();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<ResourceItem>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (r) => (
        <div>
          <div><strong>{r.title}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>{r.file_path}</small>
        </div>
      ),
    },
    {
      key: 'kind',
      label: 'Type',
      render: (r) => {
        let label = 'Other';
        if (r.kind === 'question-bank') label = 'Question Bank';
        else if (r.kind === 'exam-portion') label = 'Exam Portion';
        else if (r.kind === 'policy') label = 'Policy / Rule';
        return <span className={styles.kindBadge}>{label}</span>;
      },
    },
    {
      key: 'class_name',
      label: 'Target',
      render: (r) => (
        <span>
          {r.class_name || 'All Classes'} &bull; {r.subject_name || 'General'}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'published',
            label: 'Status',
            render: (r: ResourceItem) => (
              <span className={r.published ? styles.pubTag : styles.unpubTag}>
                {r.published ? 'Published' : 'Draft / Hidden'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'created_at',
      label: 'Uploaded',
      render: (r: ResourceItem) => (
        <div>
          <div>{r.created_at ? r.created_at.slice(0, 10) : '—'}</div>
          <small style={{ color: 'var(--ink-soft)' }}>By {r.uploaded_by_name || 'Staff'}</small>
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (r: ResourceItem) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <a
            href={`/api/resources/${r.id}/download`}
            target="_blank"
            rel="noreferrer"
            download
            style={{ textDecoration: 'none' }}
          >
            <Button variant="secondary" size="sm">
              Download
            </Button>
          </a>
          {canManage && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTogglePublish(r)}
              >
                {r.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDelete(r.id)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Resources & Document Repository"
        description={
          canManage
            ? 'Past question papers, examination portions, academic syllabi, and official institutional policies.'
            : 'Download syllabus documents, question banks, exam portions, and official school policies.'
        }
        actions={
          canManage ? (
            <Button
              variant="primary"
              onClick={() => {
                setFormError('');
                setIsDialogOpen(true);
              }}
            >
              + Upload / Add Resource
            </Button>
          ) : undefined
        }
      />

      {/* Kind filter tabs */}
      <div className={styles.tabList} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeKind === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveKind('all')}
        >
          All Resources
        </button>
        <button
          className={`${styles.tabBtn} ${activeKind === 'question-bank' ? styles.activeTab : ''}`}
          onClick={() => setActiveKind('question-bank')}
        >
          Question Banks
        </button>
        <button
          className={`${styles.tabBtn} ${activeKind === 'exam-portion' ? styles.activeTab : ''}`}
          onClick={() => setActiveKind('exam-portion')}
        >
          Exam Portions
        </button>
        <button
          className={`${styles.tabBtn} ${activeKind === 'policy' ? styles.activeTab : ''}`}
          onClick={() => setActiveKind('policy')}
        >
          Institutional Policies
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.controlsBar}>
        <input
          type="search"
          placeholder="Search by title, subject, class..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            width: '320px',
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={resources}
        loading={loading}
        emptyText="No resources found in this category."
      />

      {/* Add Resource Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Upload / Register New Resource"
      >
        <form onSubmit={handleSubmit} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <div className={styles.formGrid}>
            <Field label="Category / Kind *" required>
              <select
                required
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="question-bank">Question Bank</option>
                <option value="exam-portion">Exam Portion</option>
                <option value="policy">Institutional Policy / Rule</option>
                <option value="other">General Curriculum Document</option>
              </select>
            </Field>

            <Field label="Document Title *" required>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Class 9 Compulsory Math Model Question 2083"
              />
            </Field>
          </div>

          {form.kind !== 'policy' && (
            <div className={styles.formGrid}>
              <Field label="Target Class">
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                >
                  <option value="">All Classes / Not Applicable</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                >
                  <option value="">All Subjects / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label="Upload File Document (PDF, Word, Image)">
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
            />
          </Field>

          <Field label="Or Existing Path / URL">
            <input
              type="text"
              value={form.file_path}
              onChange={(e) => setForm({ ...form, file_path: e.target.value })}
              placeholder="e.g. /assets/documents/student-leave-application.pdf"
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publish immediately (visible to students and public site)
          </label>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Save Resource'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
