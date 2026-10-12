'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Vacancies.module.css';

interface VacancyItem {
  id: number;
  title: string;
  type: 'teaching' | 'non-teaching';
  description: string | null;
  deadline: string | null;
  published: number;
  created_at: string;
}

interface ApplicationItem {
  id: number;
  vacancy_id: number | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  cv_path: string | null;
  status: 'new' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  vacancy_title: string | null;
}

export default function VacanciesManagementPage() {
  const [activeTab, setActiveTab] = useState<'vacancies' | 'applications'>('vacancies');
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'teaching' as 'teaching' | 'non-teaching',
    description: '',
    deadline: '',
    published: true,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === 'vacancies') {
        const res = await fetch('/api/vacancies');
        if (res.ok) {
          const d = await res.json();
          setVacancies(d.vacancies || []);
        }
      } else {
        const res = await fetch('/api/job-applications');
        if (res.ok) {
          const d = await res.json();
          setApplications(d.applications || []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const url = editId ? `/api/vacancies/${editId}` : '/api/vacancies';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vacancy');

      setIsDialogOpen(false);
      setEditId(null);
      setForm({ title: '', type: 'teaching', description: '', deadline: '', published: true });
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving vacancy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (v: VacancyItem) => {
    try {
      const res = await fetch(`/api/vacancies/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: v.published ? 0 : 1 }),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vacancy?')) return;
    try {
      const res = await fetch(`/api/vacancies/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAppStatus = async (appId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/job-applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const vacancyColumns: Column<VacancyItem>[] = [
    {
      key: 'title',
      label: 'Position Title',
      render: (v) => (
        <div>
          <div><strong>{v.title}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>{v.description?.slice(0, 80) || 'No description'}</small>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Department',
      render: (v) => (
        <span className={styles.typeBadge}>
          {v.type === 'teaching' ? 'Teaching Faculty' : 'Administrative'}
        </span>
      ),
    },
    { key: 'deadline', label: 'Deadline', render: (v) => v.deadline || 'Open until filled' },
    {
      key: 'published',
      label: 'Visibility',
      render: (v) => (
        <span style={{ fontWeight: 600, color: v.published ? 'var(--accent)' : 'var(--ink-soft)' }}>
          {v.published ? 'Published' : 'Draft / Closed'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (v) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditId(v.id);
              setForm({
                title: v.title,
                type: v.type,
                description: v.description || '',
                deadline: v.deadline || '',
                published: Boolean(v.published),
              });
              setFormError('');
              setIsDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(v)}>
            {v.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleDelete(v.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const appColumns: Column<ApplicationItem>[] = [
    {
      key: 'name',
      label: 'Candidate',
      render: (a) => (
        <div>
          <div><strong>{a.name}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>{a.phone} {a.email ? `• ${a.email}` : ''}</small>
        </div>
      ),
    },
    {
      key: 'vacancy_title',
      label: 'Position Applied',
      render: (a) => a.vacancy_title || 'General Faculty Pool',
    },
    { key: 'created_at', label: 'Applied On', render: (a) => a.created_at?.slice(0, 10) || '—' },
    {
      key: 'cv_path',
      label: 'CV / Resume',
      render: (a) =>
        a.cv_path ? (
          <a href={`/${a.cv_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Download CV &darr;
          </a>
        ) : (
          <span style={{ color: 'var(--ink-soft)' }}>No document</span>
        ),
    },
    {
      key: 'status',
      label: 'Stage',
      render: (a) => {
        let cls = styles.statusNew;
        if (a.status === 'shortlisted') cls = styles.statusShortlisted;
        else if (a.status === 'hired') cls = styles.statusHired;
        else if (a.status === 'rejected') cls = styles.statusRejected;

        return (
          <select
            value={a.status}
            onChange={(e) => handleUpdateAppStatus(a.id, e.target.value)}
            className={cls}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid var(--border)',
            }}
          >
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        );
      },
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Faculty Careers & Applications"
        description="Public faculty openings, administrative vacancies, and applicant resumes."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditId(null);
              setForm({ title: '', type: 'teaching', description: '', deadline: '', published: true });
              setFormError('');
              setIsDialogOpen(true);
            }}
          >
            + Post Vacancy
          </Button>
        }
      />

      <div className={styles.tabList} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeTab === 'vacancies' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('vacancies')}
        >
          Active Vacancies ({vacancies.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'applications' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Received Applications ({applications.length})
        </button>
      </div>

      {activeTab === 'vacancies' ? (
        <DataTable
          columns={vacancyColumns}
          rows={vacancies}
          loading={loading}
          emptyText="No career vacancies posted yet. Click + Post Vacancy to publish a teaching or non-teaching opening."
        />
      ) : (
        <DataTable
          columns={appColumns}
          rows={applications}
          loading={loading}
          emptyText="No job applications received yet."
        />
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editId ? 'Edit Vacancy' : 'Post New Career Vacancy'}
      >
        <form onSubmit={handleSubmit} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <Field label="Position Title *" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Secondary Level Mathematics Teacher"
            />
          </Field>

          <div className={styles.formGrid}>
            <Field label="Category / Type *" required>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'teaching' | 'non-teaching' })}
              >
                <option value="teaching">Teaching Faculty</option>
                <option value="non-teaching">Non-Teaching / Administrative</option>
              </select>
            </Field>

            <Field label="Application Deadline">
              <input
                type="text"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                placeholder="e.g. 2083 Baishakh 15"
              />
            </Field>
          </div>

          <Field label="Job Description & Qualifications">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Required minimum Bachelor degree in Mathematics or Science, with at least 2 years of teaching experience."
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publish on public Careers page
          </label>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Vacancy'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
