'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './StudentDetail.module.css';

interface StudentData {
  id: number;
  admission_no: string;
  user_id: number | null;
  full_name: string;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  address: string | null;
  house_id: number | null;
  house_name: string | null;
  status: 'active' | 'transferred' | 'graduated' | 'inactive';
  admitted_on: string | null;
  created_at: string;
}

interface GuardianData {
  id: number;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  is_primary: number;
}

interface EnrollmentData {
  id: number;
  roll_no: number | null;
  academic_year: string;
  class_name: string;
  section_name: string;
}

interface AttendanceCount {
  status: 'present' | 'absent' | 'late' | 'leave';
  count: number;
}

interface InvoiceData {
  id: number;
  invoice_no: string;
  title: string;
  total: number;
  due_date: string | null;
  paid_amount: number;
}

interface TransportData {
  route_name: string;
  vehicle_no: string | null;
  stop_name: string | null;
  pickup_time: string | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [guardians, setGuardians] = useState<GuardianData[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceCount[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [transport, setTransport] = useState<TransportData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'guardians' | 'attendance' | 'results' | 'fees' | 'transport'>('profile');

  // Temporary password banner
  const [createdAccount, setCreatedAccount] = useState<{ email: string; tempPass: string } | null>(null);

  // Dialogs
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    dob: '',
    gender: 'male',
    address: '',
    house_id: '',
    status: 'active',
  });

  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [sections, setSections] = useState<{ id: number; label: string }[]>([]);
  const [targetSectionId, setTargetSectionId] = useState('');

  const [isAddGuardianOpen, setIsAddGuardianOpen] = useState(false);
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    relation: 'Father',
    phone: '',
    email: '',
    create_login: false,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const loadStudent = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (res.ok) {
        const d = await res.json();
        setStudent(d.student);
        setGuardians(d.guardians || []);
        setEnrollments(d.enrollments || []);
        setAttendance(d.attendance || []);
        setInvoices(d.invoices || []);
        setTransport(d.transport);
        setEditForm({
          full_name: d.student.full_name,
          dob: d.student.dob || '',
          gender: d.student.gender || 'male',
          address: d.student.address || '',
          house_id: d.student.house_id ? String(d.student.house_id) : '',
          status: d.student.status,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const loadSections = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const d = await res.json();
        const opts: { id: number; label: string }[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({ id: sec.id, label: `${cls.name} (${sec.name})` });
          }
        }
        setSections(opts);
        if (opts.length > 0 && !targetSectionId) setTargetSectionId(String(opts[0].id));
      }
    } catch {}
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          house_id: editForm.house_id ? parseInt(editForm.house_id, 10) : null,
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        loadStudent();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: parseInt(targetSectionId, 10) }),
      });
      if (res.ok) {
        setIsSectionOpen(false);
        loadStudent();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateStudentLogin = async () => {
    if (!confirm('Create official student login credentials?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/login`, {
        method: 'POST',
      });
      const d = await res.json();
      if (res.ok) {
        setCreatedAccount({ email: d.email, tempPass: d.tempPassword });
        loadStudent();
      } else {
        alert(d.error || 'Failed to create login.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardianForm),
      });
      const d = await res.json();
      if (res.ok) {
        setIsAddGuardianOpen(false);
        if (d.tempPassword) {
          setCreatedAccount({ email: guardianForm.email, tempPass: d.tempPassword });
        }
        loadStudent();
      } else {
        alert(d.error || 'Failed to add guardian.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading student profile...</div>;
  }

  if (!student) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <p>Student not found.</p>
        <Link href="/app/students">
          <Button variant="secondary">Back to Students Directory</Button>
        </Link>
      </div>
    );
  }

  const currentEnrollment = enrollments[0];

  const guardianColumns: Column<GuardianData>[] = [
    { key: 'name', header: 'Guardian Name', render: (g: GuardianData) => <strong>{g.name}</strong> },
    { key: 'relation', header: 'Relationship', render: (g: GuardianData) => g.relation },
    { key: 'phone', header: 'Contact Phone', render: (g: GuardianData) => g.phone },
    { key: 'email', header: 'Email Address', render: (g: GuardianData) => g.email || '—' },
    {
      key: 'primary',
      header: 'Type',
      render: (g: GuardianData) =>
        g.is_primary ? (
          <span className={styles.badge} style={{ background: '#e6f4ea', color: '#137333' }}>
            Primary Guardian
          </span>
        ) : (
          <span className={styles.badge}>Secondary</span>
        ),
    },
  ];

  const invoiceColumns: Column<InvoiceData>[] = [
    { key: 'invoice_no', header: 'Invoice No', render: (i: InvoiceData) => <code>{i.invoice_no}</code> },
    { key: 'title', header: 'Description', render: (i: InvoiceData) => i.title },
    { key: 'total', header: 'Total (NPR)', render: (i: InvoiceData) => `Rs. ${i.total.toLocaleString()}` },
    { key: 'paid', header: 'Paid (NPR)', render: (i: InvoiceData) => `Rs. ${i.paid_amount.toLocaleString()}` },
    {
      key: 'balance',
      header: 'Balance',
      render: (i: InvoiceData) => {
        const bal = i.total - i.paid_amount;
        return bal <= 0 ? (
          <span style={{ color: '#137333', fontWeight: 600 }}>Paid</span>
        ) : (
          <span style={{ color: '#c5221f', fontWeight: 600 }}>Rs. {bal.toLocaleString()} Due</span>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <Link href="/app/students" style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
          ← Back to Students Directory
        </Link>
      </div>

      {createdAccount && (
        <div className={styles.tempPassAlert}>
          <strong>Account created successfully:</strong>
          <div>Email: <code>{createdAccount.email}</code></div>
          <div>Temporary Password: <code>{createdAccount.tempPass}</code></div>
          <small>Share this with the user. It will not be shown again.</small>
        </div>
      )}

      {/* Header Profile Card */}
      <div className={styles.headerCard}>
        <div className={styles.studentMeta}>
          <div className={styles.avatarBox}>
            {student.full_name.charAt(0)}
          </div>
          <div className={styles.titleGroup}>
            <h1>{student.full_name}</h1>
            <div className={styles.badges}>
              <span className={styles.badge}>Adm: {student.admission_no}</span>
              {currentEnrollment && (
                <span className={styles.badge}>
                  {currentEnrollment.class_name} ({currentEnrollment.section_name}) • Roll {currentEnrollment.roll_no}
                </span>
              )}
              {student.house_name && (
                <span className={styles.badge} style={{ color: 'var(--navy)', fontWeight: 600 }}>
                  {student.house_name}
                </span>
              )}
              <span className={styles.badge} style={{ textTransform: 'capitalize' }}>
                Status: {student.status}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
            Edit Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadSections();
              setIsSectionOpen(true);
            }}
          >
            Change Section
          </Button>
          {!student.user_id && (
            <Button variant="secondary" size="sm" onClick={handleCreateStudentLogin} disabled={actionLoading}>
              Create Student Login
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'guardians' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('guardians')}
        >
          Guardians ({guardians.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'results' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'fees' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          Fees & Invoices ({invoices.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'transport' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          Transport
        </button>
      </div>

      {/* Tab Contents */}
      <div className={styles.tabContent}>
        {activeTab === 'profile' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Admission Number</label>
              <span>{student.admission_no}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Date of Birth</label>
              <span>{student.dob || 'Not specified'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Gender</label>
              <span style={{ textTransform: 'capitalize' }}>{student.gender || 'Not specified'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Blood Group</label>
              <span>{student.blood_group || 'Not recorded'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Collegiate House</label>
              <span>{student.house_name || 'Unassigned'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Residential Address</label>
              <span>{student.address || 'Not specified'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Admitted On</label>
              <span>{student.admitted_on || 'Not recorded'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Portal User Account</label>
              <span>{student.user_id ? 'Active (Linked)' : 'No Account'}</span>
            </div>
          </div>
        )}

        {activeTab === 'guardians' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsAddGuardianOpen(true)}>
                + Add Guardian
              </Button>
            </div>
            <DataTable<GuardianData>
              columns={guardianColumns}
              rows={guardians}
              keyExtractor={(g) => g.id}
              emptyText="No guardians registered for this student."
            />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>Academic Year Attendance Record</h3>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              {['present', 'absent', 'late', 'leave'].map((statusKey) => {
                const found = attendance.find((a) => a.status === statusKey);
                return (
                  <div
                    key={statusKey}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      minWidth: '120px',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                      {statusKey}
                    </div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink)' }}>
                      {found ? found.count : 0} days
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
              Detailed day-by-day logs are available in the Attendance section.
            </p>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Examination Marksheets</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
              Marksheets will populate once terminal exams are published by faculty.
            </p>
          </div>
        )}

        {activeTab === 'fees' && (
          <div>
            <DataTable<InvoiceData>
              columns={invoiceColumns}
              rows={invoices}
              keyExtractor={(i) => i.id}
              emptyText="No invoices generated for this student yet."
            />
          </div>
        )}

        {activeTab === 'transport' && (
          <div>
            {transport ? (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Bus Route</label>
                  <span>{transport.route_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Vehicle Number</label>
                  <span>{transport.vehicle_no || 'Standard Bus'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Designated Stop</label>
                  <span>{transport.stop_name || 'School Main Stop'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Pickup Time</label>
                  <span>{transport.pickup_time || 'Morning Roster'}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                This student is not currently enrolled in school transport.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Field
            label="Full Name *"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field
              label="Date of Birth"
              type="date"
              value={editForm.dob}
              onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
            />
            <Field
              label="Gender"
              as="select"
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Field>
          </div>
          <Field
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field
              label="House"
              as="select"
              value={editForm.house_id}
              onChange={(e) => setEditForm({ ...editForm, house_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              <option value="1">Red House</option>
              <option value="2">Yellow House</option>
              <option value="3">Blue House</option>
              <option value="4">Green House</option>
              <option value="5">Orange House</option>
            </Field>
            <Field
              label="Enrollment Status"
              as="select"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'transferred' | 'graduated' | 'inactive' })}
            >
              <option value="active">Active</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
              <option value="inactive">Inactive</option>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Change Section Dialog */}
      <Dialog
        open={isSectionOpen}
        onClose={() => setIsSectionOpen(false)}
        title="Change Student Section"
      >
        <form onSubmit={handleChangeSection} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Field
            label="Select Section *"
            as="select"
            value={targetSectionId}
            onChange={(e) => setTargetSectionId(e.target.value)}
            required
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsSectionOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Assign Section'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Guardian Dialog */}
      <Dialog
        open={isAddGuardianOpen}
        onClose={() => setIsAddGuardianOpen(false)}
        title="Add Secondary Guardian"
      >
        <form onSubmit={handleAddGuardian} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Field
            label="Full Name *"
            value={guardianForm.name}
            onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
            required
          />
          <Field
            label="Relationship *"
            value={guardianForm.relation}
            onChange={(e) => setGuardianForm({ ...guardianForm, relation: e.target.value })}
            placeholder="e.g. Mother, Uncle, Grandfather"
            required
          />
          <Field
            label="Contact Phone *"
            value={guardianForm.phone}
            onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
            required
          />
          <Field
            label="Email Address"
            type="email"
            value={guardianForm.email}
            onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
            placeholder="parent@example.com"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={guardianForm.create_login}
              onChange={(e) => setGuardianForm({ ...guardianForm, create_login: e.target.checked })}
            />
            Create parent portal login account (requires email)
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsAddGuardianOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Add Guardian'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
