'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useSession, Can } from '@/components/auth/SessionProvider';
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
  const { user } = useSession();
  const router = useRouter();

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

  // If student accesses this page, redirect to their own profile
  useEffect(() => {
    if (user.role === 'student') {
      router.replace('/app/students/me');
    }
  }, [user.role, router]);

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
    if (user.role !== 'student') {
      loadData();
    }
  }, [loadData, user.role]);

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

    // Fetch houses dynamically from API
    fetch('/api/houses')
      .then((r) => r.json())
      .then((d) => {
        if (d.houses) {
          setHouses(d.houses);
        }
      })
      .catch(() => {});
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
      setFormError('Network error. Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (st: string) => {
    if (st === 'active') return <Badge variant="success">Active</Badge>;
    if (st === 'graduated') return <Badge variant="info">Graduated</Badge>;
    if (st === 'transferred') return <Badge variant="warning">Transferred</Badge>;
    return <Badge variant="neutral">Inactive</Badge>;
  };

  // PARENT VIEW: My Children Cards
  if (user.role === 'parent') {
    return (
      <div>
        <PageHeader
          title="My Children"
          description="Official enrollment records and academic credentials for your registered students at Balodaya."
        />

        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--ink-muted)' }}>
            Loading children profiles...
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--ink-muted)' }}>
            No registered children found under this parent account.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
            {students.map((child) => (
              <div
                key={child.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--accent-subtle, #e0f2fe)',
                      color: 'var(--accent, #0284c7)',
                      fontSize: 22,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {child.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                      {child.full_name}
                    </h3>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent, #0284c7)', fontWeight: 500 }}>
                      {child.class_name ? `${child.class_name} • Section ${child.section_name || 'A'}` : 'Unassigned'}
                      {child.roll_no ? ` • Roll ${child.roll_no}` : ''}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                      Admission ID: {child.admission_no}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Status</span>
                  {renderStatus(child.status)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>House</span>
                  <strong>{child.house_name || 'Unassigned'}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Link href={`/app/students/${child.id}`}>
                    <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                      Full Profile
                    </Button>
                  </Link>
                  <Link href="/app/exams">
                    <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                      Exam Marks
                    </Button>
                  </Link>
                  <Link href="/app/attendance">
                    <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                      Attendance
                    </Button>
                  </Link>
                  <Link href="/app/fees">
                    <Button variant="primary" size="sm" style={{ width: '100%' }}>
                      Fees & Bills
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STAFF VIEW: Table
  const columns: Column<StudentItem>[] = [
    {
      key: 'admission_no',
      header: 'Adm No',
      render: (item: StudentItem) => (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
          {item.admission_no}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Full Name',
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
      key: 'class_section',
      header: 'Class / Sec',
      render: (item: StudentItem) => (
        <div>
          {item.class_name ? `${item.class_name} (${item.section_name})` : '—'}
          {item.roll_no ? (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', display: 'block' }}>
              Roll: {item.roll_no}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'house_name',
      header: 'House',
      render: (item: StudentItem) => item.house_name || '—',
    },
    {
      key: 'guardian',
      header: 'Guardian Info',
      render: (item: StudentItem) => (
        <div>
          <div>{item.guardian_name || '—'}</div>
          {item.guardian_phone && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              {item.guardian_phone}
            </span>
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
            <Can action="student.view_all">
              <a href="/api/students/export" download>
                <Button variant="secondary">Export CSV</Button>
              </a>
            </Can>
            <Can action="student.create">
              <Button variant="primary" onClick={() => setIsAddOpen(true)}>
                + Add Student
              </Button>
            </Can>
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
        <form onSubmit={handleAddSubmit} className={styles.addForm}>
          {formError && <div className={styles.errorAlert}>{formError}</div>}

          <Field label="Full Name" required>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Field label="Gender" required>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Residential Address">
            <input
              type="text"
              placeholder="e.g. Ward 4, Balodaya Chowk"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Field label="Class & Section" required>
              <select
                required
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
              >
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="School House">
              <select
                value={formData.house_id}
                onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
              >
                <option value="">No House Assigned</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <h4 style={{ margin: 'var(--space-4) 0 var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
            Primary Guardian Information
          </h4>

          <Field label="Guardian Name" required>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Sharma"
              value={formData.guardian_name}
              onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Field label="Guardian Phone" required>
              <input
                type="tel"
                required
                placeholder="e.g. 9841234567"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
              />
            </Field>

            <Field label="Guardian Email">
              <input
                type="email"
                placeholder="optional@gmail.com"
                value={formData.guardian_email}
                onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Creating...' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
