'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
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
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  review_note: string | null;
  requested_by_name: string | null;
  reviewed_by_name: string | null;
  created_at: string;
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Submit Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    from_date: '',
    to_date: '',
    reason: '',
  });

  // Review Modal
  const [reviewItem, setReviewItem] = useState<LeaveRequestItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/leave?status=${statusFilter}` : '/api/leave';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setRequests(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    // Load students for selector
    fetch('/api/students?pageSize=100')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.items || []).map((s: { id: number; full_name: string; admission_no: string }) => ({
          id: s.id,
          name: `${s.full_name} (${s.admission_no})`,
        }));
        setStudents(list);
        if (list.length > 0 && !formData.student_id) {
          setFormData((prev) => ({ ...prev, student_id: String(list[0].id) }));
        }
      })
      .catch(() => {});
  }, [formData.student_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsSubmitOpen(false);
        setFormData({
          student_id: students[0] ? String(students[0].id) : '',
          from_date: '',
          to_date: '',
          reason: '',
        });
        loadRequests();
      } else {
        const err = await res.json();
        setSubmitError(err.error || 'Failed to submit leave request.');
      }
    } catch {
      setSubmitError('Network error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;
    setReviewing(true);
    try {
      const res = await fetch(`/api/leave/${reviewItem.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          review_note: reviewNote,
        }),
      });
      if (res.ok) {
        setReviewItem(null);
        setReviewNote('');
        loadRequests();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to review leave request.');
      }
    } catch {
      alert('Network error during review.');
    } finally {
      setReviewing(false);
    }
  };

  const renderBadge = (st: LeaveRequestItem['status']) => {
    if (st === 'approved') return <span className={styles.badgeApproved}>Approved</span>;
    if (st === 'rejected') return <span className={styles.badgeRejected}>Rejected</span>;
    return <span className={styles.badgePending}>Pending</span>;
  };

  const columns: Column<LeaveRequestItem>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (item: LeaveRequestItem) => (
        <div>
          <strong>{item.student_name}</strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            {item.admission_no} • {item.class_name ? `${item.class_name} (${item.section_name})` : 'Unassigned'}
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Dates',
      render: (item: LeaveRequestItem) => (
        <div>
          <div>{item.from_date} to {item.to_date}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item: LeaveRequestItem) => (
        <div>
          <div>{item.reason}</div>
          {item.requested_by_name && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              Requested by {item.requested_by_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: LeaveRequestItem) => renderBadge(item.status),
    },
    {
      key: 'review',
      header: 'Review Details',
      render: (item: LeaveRequestItem) => (
        item.reviewed_by_name ? (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink)' }}>
              By: {item.reviewed_by_name}
            </div>
            {item.review_note && (
              <small style={{ color: 'var(--ink-muted)' }}>{item.review_note}</small>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--ink-muted)' }}>Awaiting review</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: LeaveRequestItem) => (
        item.status === 'pending' ? (
          <div className={styles.actionBtns}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setReviewItem(item);
                setReviewStatus('approved');
              }}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setReviewItem(item);
                setReviewStatus('rejected');
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Done</span>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Leave Requests"
        description="Formal leave applications, teacher/admin approvals, and automated attendance record synchronization."
        actions={
          <Button variant="primary" onClick={() => setIsSubmitOpen(true)}>
            + New Leave Application
          </Button>
        }
      />

      <div className={styles.controlBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="status-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
            Filter by Status:
          </label>
          <select
            id="status-filter"
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable<LeaveRequestItem>
        columns={columns}
        rows={requests}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyText="No leave applications match the selected filter."
      />

      {/* New Leave Request Dialog */}
      <Dialog
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Apply for Student Leave"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {submitError && (
            <div style={{ padding: 'var(--space-2)', background: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: 'var(--text-sm)' }}>
              {submitError}
            </div>
          )}

          {students.length > 0 && (
            <Field
              label="Select Student *"
              as="select"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field
              label="From Date *"
              type="date"
              value={formData.from_date}
              onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
              required
            />
            <Field
              label="To Date *"
              type="date"
              value={formData.to_date}
              onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
              required
            />
          </div>

          <Field
            label="Reason for Absence *"
            as="textarea"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Please detail the reason for requesting leave..."
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewItem !== null}
        onClose={() => setReviewItem(null)}
        title={`${reviewStatus === 'approved' ? 'Approve' : 'Reject'} Leave Request`}
      >
        {reviewItem && (
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
              Reviewing leave for <strong>{reviewItem.student_name}</strong> from{' '}
              <strong>{reviewItem.from_date}</strong> to <strong>{reviewItem.to_date}</strong>.
            </p>

            {reviewStatus === 'approved' && (
              <div style={{ padding: 'var(--space-2)', background: '#e6f4ea', color: '#137333', borderRadius: '4px', fontSize: 'var(--text-xs)' }}>
                Approving this request will automatically record attendance as &quot;Leave&quot; for school days (Sun–Fri).
              </div>
            )}

            <Field
              label="Review Note / Remark (Optional)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="e.g. Approved by Class Teacher"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" type="button" onClick={() => setReviewItem(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={reviewing}>
                {reviewing ? 'Processing...' : `Confirm ${reviewStatus === 'approved' ? 'Approval' : 'Rejection'}`}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
