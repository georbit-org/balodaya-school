'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Staff.module.css';

interface StaffItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  role: 'admin' | 'principal' | 'teacher' | 'accountant';
  active: number;
  assigned_subjects: string | null;
  class_teacher_of: string | null;
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<StaffItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    designation: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/staff?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setStaff(d.staff || []);
      }
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/staff/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setIsEditOpen(false);
      setEditItem(null);
      loadStaff();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<StaffItem>[] = [
    {
      key: 'name',
      label: 'Staff Name & Role',
      render: (s) => {
        let badgeCls = styles.roleTeacher;
        if (s.role === 'admin') badgeCls = styles.roleAdmin;
        else if (s.role === 'principal') badgeCls = styles.rolePrincipal;
        else if (s.role === 'accountant') badgeCls = styles.roleAccountant;

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>{s.name}</strong>
              <span className={`${styles.roleBadge} ${badgeCls}`}>{s.role}</span>
            </div>
            <small style={{ color: 'var(--ink-soft)' }}>
              {s.designation || (s.role === 'teacher' ? 'Assistant Teacher' : s.role)}
            </small>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (s) => (
        <div>
          <div>{s.phone || 'No phone'}</div>
          <small style={{ color: 'var(--ink-soft)' }}>{s.email}</small>
        </div>
      ),
    },
    {
      key: 'assigned_subjects',
      label: 'Assigned Subjects',
      render: (s) => {
        if (!s.assigned_subjects) return <span style={{ color: 'var(--ink-soft)' }}>None assigned</span>;
        const list = s.assigned_subjects.split(', ');
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {list.map((sub, idx) => (
              <span key={idx} className={styles.tagSubject}>{sub}</span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'class_teacher_of',
      label: 'Class Teacher',
      render: (s) => (
        <span style={{ fontWeight: 500 }}>
          {s.class_teacher_of || '—'}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (s) => (
        <span style={{ fontWeight: 600, color: s.active ? '#15803d' : '#b91c1c' }}>
          {s.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (s) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditItem(s);
            setForm({
              name: s.name,
              phone: s.phone || '',
              designation: s.designation || '',
            });
            setFormError('');
            setIsEditOpen(true);
          }}
        >
          Edit Profile
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Faculty & Staff Directory"
        description="Faculty rosters, departmental designations, subject assignments, and class teacher responsibilities."
      />

      <div className={styles.controlsBar}>
        <div className={styles.roleFilter} role="tablist">
          <button
            className={`${styles.roleBtn} ${roleFilter === 'all' ? styles.activeRole : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All Staff
          </button>
          <button
            className={`${styles.roleBtn} ${roleFilter === 'teacher' ? styles.activeRole : ''}`}
            onClick={() => setRoleFilter('teacher')}
          >
            Teachers
          </button>
          <button
            className={`${styles.roleBtn} ${roleFilter === 'principal' ? styles.activeRole : ''}`}
            onClick={() => setRoleFilter('principal')}
          >
            Principal
          </button>
          <button
            className={`${styles.roleBtn} ${roleFilter === 'accountant' ? styles.activeRole : ''}`}
            onClick={() => setRoleFilter('accountant')}
          >
            Accountants
          </button>
          <button
            className={`${styles.roleBtn} ${roleFilter === 'admin' ? styles.activeRole : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Admins
          </button>
        </div>

        <input
          type="search"
          placeholder="Search by name, phone, designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            width: '280px',
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={staff}
        loading={loading}
        emptyText="No faculty or staff found."
      />

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Staff Profile: ${editItem?.name}`}
      >
        <form onSubmit={handleEditSubmit} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <Field label="Full Name *" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Contact Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 9846000000"
            />
          </Field>

          <Field label="Official Designation">
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              placeholder="e.g. Senior Secondary Mathematics Faculty / Department Head"
            />
          </Field>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
