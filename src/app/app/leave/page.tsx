'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useSession } from '@/components/auth/SessionProvider';
import { formatBS } from '@/lib/calendar';
import styles from './Leave.module.css';

interface LeaveRequestItem {
  id: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_name: string | null;
  section_name: string | null;
  from_date: string;
  to_date: string;
  working_days: number | null;
  leave_type: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_at: string | null;
  review_note: string | null;
  requested_by_name: string | null;
  reviewed_by_name: string | null;
  created_at: string;
}

interface StaffLeaveItem {
  id: number;
  user_id: number;
  applicant_name?: string;
  applicant_role?: string;
  applicant_designation?: string;
  leave_type_code: string;
  leave_type_name: string;
  from_date: string;
  to_date: string;
  working_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  approver_name?: string;
  reviewer_name?: string;
  review_note?: string;
  created_at: string;
}

interface LeaveBalance {
  leave_type_id: number;
  code: string;
  name: string;
  annual_quota: number | null;
  allocated: number;
  used: number;
}

export default function LeaveManagementPage() {
  const { user } = useSession();

  const isTeacher = user.role === 'teacher';
  const isPrincipal = user.role === 'principal';
  const isAdmin = user.role === 'admin';
  const isAccountant = user.role === 'accountant';
  const isStudentOrParent = user.role === 'student' || user.role === 'parent';

  // Default active tab based on role
  const [activeTab, setActiveTab] = useState<'my_leave' | 'student_leave' | 'staff_reviews'>(
    isStudentOrParent ? 'student_leave' : isTeacher || isAccountant ? 'my_leave' : 'staff_reviews'
  );

  // Student leaves
  const [studentLeaves, setStudentLeaves] = useState<LeaveRequestItem[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Staff leaves
  const [staffMyLeaves, setStaffMyLeaves] = useState<StaffLeaveItem[]>([]);
  const [staffPendingReviews, setStaffPendingReviews] = useState<StaffLeaveItem[]>([]);
  const [staffBalances, setStaffBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Apply Student Leave Modal
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [studentForm, setStudentForm] = useState({
    student_id: '',
    from_date: '',
    to_date: '',
    leave_type: 'Sick / Medical',
    reason: '',
  });

  // Apply Staff Leave Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffForm, setStaffForm] = useState({
    leave_type_id: '',
    from_date: '',
    to_date: '',
    half_day: 0,
    reason: '',
  });

  // Review Student Leave Modal
  const [reviewStudentItem, setReviewStudentItem] = useState<LeaveRequestItem | null>(null);
  const [reviewStudentStatus, setReviewStudentStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewStudentNote, setReviewStudentNote] = useState('');
  const [reviewStudentSaving, setReviewStudentSaving] = useState(false);

  // Review Staff Leave Modal
  const [reviewStaffItem, setReviewStaffItem] = useState<StaffLeaveItem | null>(null);
  const [reviewStaffStatus, setReviewStaffStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewStaffNote, setReviewStaffNote] = useState('');
  const [reviewStaffSaving, setReviewStaffSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load Student Leaves
  const loadStudentLeaves = useCallback(async () => {
    setStudentLoading(true);
    try {
      const url = statusFilter ? `/api/leave?status=${statusFilter}` : '/api/leave';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setStudentLeaves(d.items || []);
      }
    } catch {
      // Ignore
    } finally {
      setStudentLoading(false);
    }
  }, [statusFilter]);

  // Load Staff Leaves
  const loadStaffLeaves = useCallback(async () => {
    if (isStudentOrParent) return;
    setStaffLoading(true);
    try {
      const res = await fetch('/api/staff-leave');
      if (res.ok) {
        const d = await res.json();
        setStaffMyLeaves(d.myRequests || []);
        setStaffPendingReviews(d.pendingReviews || []);
        setStaffBalances(d.balances || []);
        setLeaveTypes(d.leaveTypes || []);
        if (d.leaveTypes?.length > 0 && !staffForm.leave_type_id) {
          setStaffForm((prev) => ({ ...prev, leave_type_id: String(d.leaveTypes[0].id) }));
        }
      }
    } catch {
      // Ignore
    } finally {
      setStaffLoading(false);
    }
  }, [isStudentOrParent, staffForm.leave_type_id]);

  useEffect(() => {
    loadStudentLeaves();
    loadStaffLeaves();
  }, [loadStudentLeaves, loadStaffLeaves]);

  // Submit Student Leave
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit student leave.');

      setStudentModalOpen(false);
      setStudentForm({ student_id: '', from_date: '', to_date: '', leave_type: 'Sick / Medical', reason: '' });
      setSuccessMsg(`Student leave application submitted successfully (${data.workingDays} school working days).`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStudentLeaves();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setStudentSubmitting(false);
    }
  };

  // Submit Staff Leave
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/staff-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit staff leave application.');

      setStaffModalOpen(false);
      setStaffForm({ leave_type_id: leaveTypes[0]?.id ? String(leaveTypes[0].id) : '', from_date: '', to_date: '', half_day: 0, reason: '' });
      setSuccessMsg(`Staff leave application submitted to Principal (${data.workingDays} working days).`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStaffLeaves();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Review Student Leave
  const handleReviewStudent = async () => {
    if (!reviewStudentItem) return;
    setReviewStudentSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/leave/${reviewStudentItem.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStudentStatus,
          review_note: reviewStudentNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review leave.');

      setReviewStudentItem(null);
      setReviewStudentNote('');
      setSuccessMsg(`Student leave ${reviewStudentStatus} successfully. Attendance records updated.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStudentLeaves();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setReviewStudentSaving(false);
    }
  };

  // Review Staff Leave
  const handleReviewStaff = async () => {
    if (!reviewStaffItem) return;
    setReviewStaffSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/staff-leave/${reviewStaffItem.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStaffStatus,
          review_note: reviewStaffNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review staff leave.');

      setReviewStaffItem(null);
      setReviewStaffNote('');
      setSuccessMsg(`Staff leave ${reviewStaffStatus} successfully. Staff attendance marked.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStaffLeaves();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setReviewStaffSaving(false);
    }
  };

  // Student Columns
  const studentColumns: Column<LeaveRequestItem>[] = [
    {
      key: 'student_name',
      header: 'Student',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.student_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {item.admission_no} • {item.class_name} ({item.section_name})
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Leave Period & Days',
      render: (item) => (
        <div>
          <div>{item.from_date} → {item.to_date}</div>
          <div style={{ fontSize: '12px', color: 'var(--brand-700)', fontWeight: 500 }}>
            {item.working_days ? `${item.working_days} school days` : 'Full period'} • BS: {formatBS(item.from_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item) => (
        <div>
          <Badge variant="neutral">{item.leave_type || 'Personal'}</Badge>
          <div style={{ marginTop: '4px', fontSize: '13px' }}>{item.reason}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
        >
          {item.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => {
        if (item.status === 'pending' && (isTeacher || isPrincipal || isAdmin)) {
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setReviewStudentItem(item);
                setReviewStudentStatus('approved');
                setReviewStudentNote('');
              }}
            >
              Review
            </Button>
          );
        }
        if (item.reviewed_by_name) {
          return (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              By {item.reviewed_by_name}
            </span>
          );
        }
        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
      },
    },
  ];

  // Staff Columns
  const staffMyColumns: Column<StaffLeaveItem>[] = [
    {
      key: 'leave_type',
      header: 'Leave Type',
      render: (item) => <strong>{item.leave_type_name}</strong>,
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (item) => (
        <div>
          <div>{item.from_date} → {item.to_date}</div>
          <div style={{ fontSize: '12px', color: 'var(--brand-700)' }}>
            {item.working_days} working days • BS: {formatBS(item.from_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item) => item.reason,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
        >
          {item.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'approver',
      header: 'Reviewed By',
      render: (item) => item.reviewer_name || (item.approver_name ? `Pending (${item.approver_name})` : 'Pending Principal'),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Leave Management & Absence Authorization"
        description="Submit leave requests with working-day validation and manage approval workflows across class teachers and school administration."
      />

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#e6f4ea', color: '#137333', borderRadius: '8px', border: '1px solid #ceead6' }}>
          <Icon name="check-circle" size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fce8e6', color: '#c5221f', borderRadius: '8px', border: '1px solid #fad2cf' }}>
          <Icon name="alert-triangle" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TABS */}
      {!isStudentOrParent && (
        <div className={styles.tabsBar}>
          {(isTeacher || isAccountant) && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'my_leave' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('my_leave')}
            >
              <Icon name="user" size={14} style={{ marginRight: '6px' }} />
              My Leave Applications (मेरो बिदा)
            </button>
          )}

          {(isPrincipal || isAdmin) && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'staff_reviews' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('staff_reviews')}
            >
              <Icon name="staff" size={14} style={{ marginRight: '6px' }} />
              Staff Leave Requests to Review ({staffPendingReviews.length})
            </button>
          )}

          {(isPrincipal || isAdmin) && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'my_leave' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('my_leave')}
            >
              <Icon name="file-text" size={14} style={{ marginRight: '6px' }} />
              My Leave Applications
            </button>
          )}

          {(isTeacher || isPrincipal || isAdmin) && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'student_leave' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('student_leave')}
            >
              <Icon name="students" size={14} style={{ marginRight: '6px' }} />
              Student Leave Requests
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: MY STAFF LEAVE (Teacher, Accountant, Principal) */}
      {activeTab === 'my_leave' && !isStudentOrParent && (
        <div>
          <div className={styles.controlBar}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>My Annual Leave Balance</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Track your allocated, consumed, and remaining leave entitlements.
              </p>
            </div>
            <Button variant="primary" onClick={() => setStaffModalOpen(true)}>
              + Apply for Leave (बिदा आवेदन)
            </Button>
          </div>

          {/* Balance Cards */}
          <div className={styles.balanceGrid}>
            {staffBalances.map((b) => {
              const remaining = Math.max(0, b.allocated - b.used);
              return (
                <div key={b.leave_type_id} className={styles.balanceCard}>
                  <div className={styles.balanceTitle}>{b.name}</div>
                  <div className={styles.balanceValue}>{remaining} <span style={{ fontSize: '13px', fontWeight: 400 }}>days left</span></div>
                  <div className={styles.balanceQuota}>Used: {b.used} / {b.annual_quota ?? '∞'} days</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>My Submitted Leave History</h4>
            <DataTable<StaffLeaveItem>
              columns={staffMyColumns}
              rows={staffMyLeaves}
              loading={staffLoading}
              emptyText="You have not submitted any staff leave applications yet."
            />
          </div>
        </div>
      )}

      {/* VIEW 2: STAFF REVIEWS (Principal reviews teachers/accountants, Admin reviews Principal) */}
      {activeTab === 'staff_reviews' && (isPrincipal || isAdmin) && (
        <div>
          <div className={styles.controlBar}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {isPrincipal ? 'Faculty & Staff Leave Approvals' : 'Principal & Senior Administration Leave Approvals'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {isPrincipal
                  ? 'Review, approve, or reject leave applications submitted by teachers and non-academic staff.'
                  : 'Review leave applications submitted by the school Principal.'}
              </p>
            </div>
          </div>

          <DataTable<StaffLeaveItem>
            columns={[
              {
                key: 'applicant',
                header: 'Staff Member',
                render: (item: StaffLeaveItem) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.applicant_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.applicant_designation || item.applicant_role}
                    </div>
                  </div>
                ),
              },
              {
                key: 'leave_type',
                header: 'Type',
                render: (item: StaffLeaveItem) => <strong>{item.leave_type_name}</strong>,
              },
              {
                key: 'dates',
                header: 'Dates',
                render: (item: StaffLeaveItem) => (
                  <div>
                    <div>{item.from_date} → {item.to_date}</div>
                    <div style={{ fontSize: '12px', color: 'var(--brand-700)' }}>
                      {item.working_days} working days • BS: {formatBS(item.from_date)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'reason',
                header: 'Reason',
                render: (item: StaffLeaveItem) => item.reason,
              },
              {
                key: 'action',
                header: 'Action',
                render: (item: StaffLeaveItem) => (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setReviewStaffItem(item);
                      setReviewStaffStatus('approved');
                      setReviewStaffNote('');
                    }}
                  >
                    Review Application
                  </Button>
                ),
              },
            ]}
            rows={staffPendingReviews}
            loading={staffLoading}
            emptyText="No pending staff leave applications awaiting your review."
          />
        </div>
      )}

      {/* VIEW 3: STUDENT LEAVES */}
      {(activeTab === 'student_leave' || isStudentOrParent) && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.filterGroup}>
              <label htmlFor="leave-status" style={{ fontSize: '14px', fontWeight: 500 }}>Filter Status:</label>
              <select
                id="leave-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.statusFilter}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {isStudentOrParent && (
              <Button variant="primary" onClick={() => setStudentModalOpen(true)}>
                + Apply for Student Leave
              </Button>
            )}
          </div>

          <DataTable<LeaveRequestItem>
            columns={studentColumns}
            rows={studentLeaves}
            loading={studentLoading}
            emptyText="No student leave requests found."
          />
        </div>
      )}

      {/* APPLY STUDENT LEAVE DIALOG */}
      <Dialog
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        title="Apply for Student Leave"
      >
        <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Leave Category" required>
            <select
              value={studentForm.leave_type}
              onChange={(e) => setStudentForm({ ...studentForm, leave_type: e.target.value })}
            >
              <option value="Sick / Medical">Sick / Medical Leave (बिरामी बिदा)</option>
              <option value="Family Function">Family / Religious Function (घरायसी बिदा)</option>
              <option value="Bereavement">Bereavement / Mourning (किरिया बिदा)</option>
              <option value="Urgent Travel">Urgent Travel / Personal</option>
            </select>
          </Field>

          <Field label="From Date (YYYY-MM-DD)" required>
            <input
              type="date"
              required
              value={studentForm.from_date}
              onChange={(e) => setStudentForm({ ...studentForm, from_date: e.target.value })}
            />
          </Field>

          <Field label="To Date (YYYY-MM-DD)" required>
            <input
              type="date"
              required
              value={studentForm.to_date}
              onChange={(e) => setStudentForm({ ...studentForm, to_date: e.target.value })}
            />
          </Field>

          <Field label="Reason / Explanation" required>
            <textarea
              required
              rows={3}
              placeholder="State the reason for requesting leave..."
              value={studentForm.reason}
              onChange={(e) => setStudentForm({ ...studentForm, reason: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" type="button" onClick={() => setStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={studentSubmitting}>
              {studentSubmitting ? 'Submitting...' : 'Submit to Class Teacher'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* APPLY STAFF LEAVE DIALOG */}
      <Dialog
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Apply for Staff Leave to Principal"
      >
        <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Staff Leave Type" required>
            <select
              value={staffForm.leave_type_id}
              onChange={(e) => setStaffForm({ ...staffForm, leave_type_id: e.target.value })}
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} (Quota: {lt.annual_quota ?? 'Unlimited'} days)
                </option>
              ))}
            </select>
          </Field>

          <Field label="From Date (YYYY-MM-DD)" required>
            <input
              type="date"
              required
              value={staffForm.from_date}
              onChange={(e) => setStaffForm({ ...staffForm, from_date: e.target.value })}
            />
          </Field>

          <Field label="To Date (YYYY-MM-DD)" required>
            <input
              type="date"
              required
              value={staffForm.to_date}
              onChange={(e) => setStaffForm({ ...staffForm, to_date: e.target.value })}
            />
          </Field>

          <Field label="Reason / Justification" required>
            <textarea
              required
              rows={3}
              placeholder="State the reason for staff leave..."
              value={staffForm.reason}
              onChange={(e) => setStaffForm({ ...staffForm, reason: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" type="button" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={staffSubmitting}>
              {staffSubmitting ? 'Submitting...' : isPrincipal ? 'Submit to Administrator' : 'Submit to Principal'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* REVIEW STUDENT LEAVE DIALOG */}
      <Dialog
        open={Boolean(reviewStudentItem)}
        onClose={() => setReviewStudentItem(null)}
        title="Review Student Leave Application"
      >
        {reviewStudentItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px', fontSize: '14px' }}>
              <div><strong>Student:</strong> {reviewStudentItem.student_name} ({reviewStudentItem.admission_no})</div>
              <div><strong>Dates:</strong> {reviewStudentItem.from_date} → {reviewStudentItem.to_date} ({reviewStudentItem.working_days || '—'} school days)</div>
              <div><strong>Reason:</strong> {reviewStudentItem.reason}</div>
            </div>

            <Field label="Decision">
              <select
                value={reviewStudentStatus}
                onChange={(e) => setReviewStudentStatus(e.target.value as any)}
              >
                <option value="approved">Approve Leave (Mark attendance as leave on school days)</option>
                <option value="rejected">Reject Leave</option>
              </select>
            </Field>

            <Field label="Reviewer Note (Optional)">
              <textarea
                rows={2}
                placeholder="Remarks for student/parent..."
                value={reviewStudentNote}
                onChange={(e) => setReviewStudentNote(e.target.value)}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setReviewStudentItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={reviewStudentSaving} onClick={handleReviewStudent}>
                {reviewStudentSaving ? 'Saving...' : 'Confirm Decision'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* REVIEW STAFF LEAVE DIALOG */}
      <Dialog
        open={Boolean(reviewStaffItem)}
        onClose={() => setReviewStaffItem(null)}
        title="Review Staff Leave Application"
      >
        {reviewStaffItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px', fontSize: '14px' }}>
              <div><strong>Staff Member:</strong> {reviewStaffItem.applicant_name} ({reviewStaffItem.applicant_role})</div>
              <div><strong>Leave Type:</strong> {reviewStaffItem.leave_type_name}</div>
              <div><strong>Dates:</strong> {reviewStaffItem.from_date} → {reviewStaffItem.to_date} ({reviewStaffItem.working_days} working days)</div>
              <div><strong>Reason:</strong> {reviewStaffItem.reason}</div>
            </div>

            <Field label="Decision">
              <select
                value={reviewStaffStatus}
                onChange={(e) => setReviewStaffStatus(e.target.value as any)}
              >
                <option value="approved">Approve Leave (Deduct quota and mark staff attendance)</option>
                <option value="rejected">Reject Leave</option>
              </select>
            </Field>

            <Field label="Review Note / Remarks">
              <textarea
                rows={2}
                placeholder="Remarks for staff applicant..."
                value={reviewStaffNote}
                onChange={(e) => setReviewStaffNote(e.target.value)}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setReviewStaffItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={reviewStaffSaving} onClick={handleReviewStaff}>
                {reviewStaffSaving ? 'Saving...' : 'Confirm Decision'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
