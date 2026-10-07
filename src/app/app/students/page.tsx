'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import styles from './StudentsList.module.css';

interface StudentItem {
  id: number;
  admission_no: string;
  full_name: string;
  gender: string | null;
  dob: string | null;
  status: 'active' | 'transferred' | 'graduated' | 'inactive';
  house_name: string | null;
  class_name: string | null;
  section_name: string | null;
  roll_no: number | null;
  guardian_name: string | null;
  guardian_phone: string | null;
}

interface ClassSectionOption {
  sectionId: number;
  label: string;
}

interface HouseOption {
  id: number;
  name: string;
}

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter options
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [houses, setHouses] = useState<HouseOption[]>([]);

  // Add Student Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'male',
    dob: '',
    address: '',
    section_id: '',
    house_id: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sectionFilter) params.set('section_id', sectionFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');

      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setStudents(d.items || []);
        setTotal(d.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sectionFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Load metadata options
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const opts: ClassSectionOption[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({
              sectionId: sec.id,
              label: `${cls.name} - Section ${sec.name}`,
            });
          }
        }
        setSections(opts);
        if (opts.length > 0 && !formData.section_id) {
          setFormData((prev) => ({ ...prev, section_id: String(opts[0].sectionId) }));
        }
      })
      .catch(() => {});

    // Houses can be queried or statically populated
    setHouses([
      { id: 1, name: 'Red House (Laligurans)' },
      { id: 2, name: 'Yellow House (Kanchan)' },
      { id: 3, name: 'Blue House (Danphe)' },
      { id: 4, name: 'Green House (Himalaya)' },
      { id: 5, name: 'Orange House (Machhapuchhre)' },
    ]);
  }, [formData.section_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          section_id: parseInt(formData.section_id, 10),
          house_id: formData.house_id ? parseInt(formData.house_id, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add student.');
        return;
      }

      setIsAddOpen(false);
      setFormData({
        full_name: '',
        gender: 'male',
        dob: '',
        address: '',
        section_id: sections[0] ? String(sections[0].sectionId) : '',
        house_id: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
      });
      loadData();
    } catch {
      setFormError('Network error while saving student.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (st: StudentItem['status']) => {
    switch (st) {
      case 'active':
        return <span className={styles.statusActive}>Active</span>;
      case 'transferred':
        return <span className={styles.statusTransferred}>Transferred</span>;
      case 'graduated':
        return <span className={styles.statusGraduated}>Graduated</span>;
      case 'inactive':
        return <span className={styles.statusInactive}>Inactive</span>;
      default:
        return <span>{st}</span>;
    }
  };

  const columns: Column<StudentItem>[] = [
    {
      key: 'admission_no',
      header: 'Admission No',
      render: (item: StudentItem) => (
        <Link href={`/app/students/${item.id}`} className={styles.studentLink}>
          {item.admission_no}
        </Link>
      ),
    },
    {
      key: 'full_name',
      header: 'Student Name',
      render: (item: StudentItem) => (
        <div>
          <strong style={{ color: 'var(--ink)' }}>{item.full_name}</strong>
          {item.gender && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>
              {item.gender}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class & Section',
      render: (item: StudentItem) => (
        item.class_name ? (
          <span>
            {item.class_name} {item.section_name ? `(${item.section_name})` : ''}
          </span>
        ) : (
          <span style={{ color: 'var(--ink-muted)' }}>Not assigned</span>
        )
      ),
    },
    {
      key: 'roll_no',
      header: 'Roll No',
      render: (item: StudentItem) => item.roll_no ?? '—',
    },
    {
      key: 'house_name',
      header: 'House',
      render: (item: StudentItem) => item.house_name ?? '—',
    },
    {
      key: 'guardian',
      header: 'Primary Guardian',
      render: (item: StudentItem) => (
        <div>
          <div>{item.guardian_name || '—'}</div>
          {item.guardian_phone && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              {item.guardian_phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: StudentItem) => renderStatus(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: StudentItem) => (
        <Link href={`/app/students/${item.id}`}>
          <Button variant="secondary" size="sm">
            View Profile
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students Directory"
        description="Official student roll, section assignments, academic records, and profiles."
        actions={
          <div className={styles.actions}>
            <a href="/api/students/export" download>
              <Button variant="secondary">Export CSV</Button>
            </a>
            <Button variant="primary" onClick={() => setIsAddOpen(true)}>
              + Add Student
            </Button>
          </div>
        }
      />

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search student by name, admission no, or guardian phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className={styles.selectInput}
          value={sectionFilter}
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Classes & Sections</option>
          {sections.map((s) => (
            <option key={s.sectionId} value={s.sectionId}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          className={styles.selectInput}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="transferred">Transferred</option>
          <option value="graduated">Graduated</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable<StudentItem>
        columns={columns}
        rows={students}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyText="No results match your search."
      />

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Student"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {formError && (
            <div style={{ padding: 'var(--space-2)', background: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: 'var(--text-sm)' }}>
              {formError}
            </div>
          )}

          <div className={styles.formGrid}>
            <Field
              label="Full Name *"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="e.g. Aarav Sharma"
            />
            <Field
              label="Gender"
              as="select"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Field>
          </div>

          <div className={styles.formGrid}>
            <Field
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Field
              label="Class & Section *"
              as="select"
              value={formData.section_id}
              onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
              required
            >
              {sections.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>
                  {s.label}
                </option>
              ))}
            </Field>
          </div>

          <div className={styles.formGrid}>
            <Field
              label="House Assignment"
              as="select"
              value={formData.house_id}
              onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
            >
              <option value="">None (Unassigned)</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Field>
            <Field
              label="Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Bayarghari, Syangja"
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space-2) 0' }} />

          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>Primary Guardian Details</strong>

          <div className={styles.formGrid}>
            <Field
              label="Guardian Name *"
              value={formData.guardian_name}
              onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              required
              placeholder="e.g. Ram Prasad Sharma"
            />
            <Field
              label="Guardian Phone *"
              value={formData.guardian_phone}
              onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
              required
              placeholder="e.g. 9846012345"
            />
          </div>

          <Field
            label="Guardian Email (Optional)"
            type="email"
            value={formData.guardian_email}
            onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
            placeholder="guardian@example.com"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Student'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
