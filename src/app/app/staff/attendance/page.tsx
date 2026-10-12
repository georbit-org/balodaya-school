'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { todayNPT, formatBS, addDays } from '@/lib/calendar';
import { useSession } from '@/components/auth/SessionProvider';
import styles from './StaffAttendance.module.css';

interface StaffAttendanceRecord {
  user_id: number;
  name: string;
  email: string;
  role: string;
  designation: string;
  phone: string | null;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half_day' | 'on_duty';
  check_in: string | null;
  check_out: string | null;
  note: string | null;
  on_approved_leave: boolean;
  leave_type: string | null;
  marked_by_name: string | null;
}

export default function StaffAttendancePage() {
  const { user } = useSession();
  const canMark = user.role === 'admin' || user.role === 'principal';

  const [date, setDate] = useState<string>(todayNPT());
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [offDayReason, setOffDayReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff-attendance?date=${selectedDate}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load staff attendance');

      setRecords(data.records || []);
      setIsWorkingDay(data.isWorkingDay);
      setOffDayReason(data.offDayReason);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error loading staff attendance',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date, loadData]);

  const handlePrevDay = () => setDate((d) => addDays(d, -1));
  const handleNextDay = () => {
    const next = addDays(date, 1);
    if (next <= todayNPT()) {
      setDate(next);
    }
  };

  const updateStatus = (userId: number, newStatus: StaffAttendanceRecord['status']) => {
    setRecords((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, status: newStatus } : r))
    );
  };

  const updateTime = (userId: number, field: 'check_in' | 'check_out', val: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, [field]: val || null } : r))
    );
  };

  const updateNote = (userId: number, val: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, note: val || null } : r))
    );
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) =>
        r.on_approved_leave ? r : { ...r, status: 'present' }
      )
    );
  };

  const handleSave = async () => {
    if (!canMark) return;
    setSaving(true);
    setMessage(null);
    try {
      const entries = records.map((r) => ({
        user_id: r.user_id,
        status: r.status,
        check_in: r.check_in,
        check_out: r.check_out,
        note: r.note,
      }));

      const res = await fetch('/api/staff-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          entries,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save staff attendance');

      setMessage({ type: 'success', text: data.message || 'Staff attendance recorded successfully.' });
      loadData(date);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving staff attendance',
      });
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const leaveCount = records.filter((r) => r.status === 'leave').length;
  const onDutyCount = records.filter((r) => r.status === 'on_duty').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Staff & Faculty Attendance"
        description="Daily institutional reporting, punch records, and duty tracking for school staff."
      />

      {/* Date & Quick Navigation Bar */}
      <div className={styles.topBar}>
        <div className={styles.dateSelector}>
          <Button variant="secondary" size="sm" onClick={handlePrevDay}>
            ← Previous
          </Button>
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            max={todayNPT()}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNextDay}
            disabled={date >= todayNPT()}
          >
            Next →
          </Button>

          <span className={styles.bsPill}>
            BS: {formatBS(date, { lang: 'en', includeDayOfWeek: true })}
          </span>
        </div>

        {canMark && isWorkingDay && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving || !isWorkingDay}
            >
              {saving ? 'Saving...' : 'Save Attendance Sheet'}
            </Button>
          </div>
        )}
      </div>

      {/* Non-working day Alert */}
      {!isWorkingDay && (
        <div className={styles.offDayBanner}>
          <Icon name="calendar" size={18} />
          <div>
            <strong>School Closed ({offDayReason || 'Official Off Day'}):</strong> Attendance cannot be marked on scheduled weekly off days or government-approved school holidays.
          </div>
        </div>
      )}

      {/* Message / Toast */}
      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Metrics Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Staff</span>
          <span className={styles.statValue}>{totalCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Present</span>
          <span className={styles.statValue} style={{ color: '#16a34a' }}>
            {presentCount}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Late Arrival</span>
          <span className={styles.statValue} style={{ color: '#d97706' }}>
            {lateCount}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>On Leave</span>
          <span className={styles.statValue} style={{ color: '#2563eb' }}>
            {leaveCount}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>On Duty</span>
          <span className={styles.statValue} style={{ color: '#7c3aed' }}>
            {onDutyCount}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Absent</span>
          <span className={styles.statValue} style={{ color: '#dc2626' }}>
            {absentCount}
          </span>
        </div>
      </div>

      {/* Staff Attendance Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.staffTable}>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role & Designation</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Remarks / Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading staff roster...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No active staff members found.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const initials = r.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr key={r.user_id}>
                    <td>
                      <div className={styles.staffInfo}>
                        <div className={styles.avatar}>{initials}</div>
                        <div>
                          <div className={styles.staffName}>{r.name}</div>
                          <div className={styles.staffRole}>{r.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.designation}</span>
                        <Badge variant="neutral">{r.role.toUpperCase()}</Badge>
                      </div>
                    </td>

                    <td>
                      {r.on_approved_leave ? (
                        <div className={styles.leaveBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="lock" size={12} />
                          <span>Leave ({r.leave_type})</span>
                        </div>
                      ) : !canMark || !isWorkingDay ? (
                        <Badge
                          variant={
                            r.status === 'present'
                              ? 'success'
                              : r.status === 'absent'
                              ? 'danger'
                              : r.status === 'late'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {r.status.toUpperCase()}
                        </Badge>
                      ) : (
                        <div className={styles.statusGroup}>
                          <button
                            type="button"
                            className={`${styles.statusBtn} ${
                              r.status === 'present' ? styles.statusBtnActivePresent : ''
                            }`}
                            onClick={() => updateStatus(r.user_id, 'present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusBtn} ${
                              r.status === 'late' ? styles.statusBtnActiveLate : ''
                            }`}
                            onClick={() => updateStatus(r.user_id, 'late')}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusBtn} ${
                              r.status === 'on_duty' ? styles.statusBtnActiveOnDuty : ''
                            }`}
                            onClick={() => updateStatus(r.user_id, 'on_duty')}
                          >
                            On Duty
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusBtn} ${
                              r.status === 'leave' ? styles.statusBtnActiveLeave : ''
                            }`}
                            onClick={() => updateStatus(r.user_id, 'leave')}
                          >
                            Leave
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusBtn} ${
                              r.status === 'absent' ? styles.statusBtnActiveAbsent : ''
                            }`}
                            onClick={() => updateStatus(r.user_id, 'absent')}
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </td>

                    <td>
                      {canMark && isWorkingDay && !r.on_approved_leave ? (
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={r.check_in || ''}
                          onChange={(e) => updateTime(r.user_id, 'check_in', e.target.value)}
                        />
                      ) : (
                        <span>{r.check_in || '—'}</span>
                      )}
                    </td>

                    <td>
                      {canMark && isWorkingDay && !r.on_approved_leave ? (
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={r.check_out || ''}
                          onChange={(e) => updateTime(r.user_id, 'check_out', e.target.value)}
                        />
                      ) : (
                        <span>{r.check_out || '—'}</span>
                      )}
                    </td>

                    <td>
                      {canMark && isWorkingDay && !r.on_approved_leave ? (
                        <input
                          type="text"
                          className={styles.noteInput}
                          placeholder="Optional notes or gate pass"
                          value={r.note || ''}
                          onChange={(e) => updateNote(r.user_id, e.target.value)}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {r.note || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {canMark && isWorkingDay && records.length > 0 && (
        <div className={styles.bottomBar}>
          <Button variant="secondary" onClick={handleMarkAllPresent}>
            Mark All Present
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Attendance Sheet'}
          </Button>
        </div>
      )}
    </div>
  );
}
