'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { todayNPT, formatBS } from '@/lib/calendar';
import { useSession } from '@/components/auth/SessionProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './Attendance.module.css';

interface RosterStudent {
  enrollment_id: number;
  student_id: number;
  admission_no: string;
  full_name: string;
  roll_no: number | null;
  gender: string | null;
  status: 'present' | 'absent' | 'late' | 'leave' | null;
  note: string | null;
  hasApprovedLeave?: boolean;
}

interface MonthlyStudentRow {
  enrollment_id: number;
  student_id: number;
  admission_no: string;
  full_name: string;
  roll_no: number | null;
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalMarked: number;
  percentage: number;
}

interface CalendarRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  note: string | null;
}

export default function AttendancePage() {
  const { user } = useSession();
  const isStudentOrParent = user.role === 'student' || user.role === 'parent';

  const today = todayNPT();
  const currentMonth = today.slice(0, 7);

  const [mode, setMode] = useState<'roster' | 'monthly' | 'calendar'>(
    isStudentOrParent ? 'calendar' : 'roster'
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Sections dropdown
  const [sections, setSections] = useState<{ id: number; label: string }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Daily roster state
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [closedReason, setClosedReason] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: 'present' | 'absent' | 'late' | 'leave'; note: string }>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Monthly report state
  const [monthlyData, setMonthlyData] = useState<{
    totalWorkingDays: number;
    students: MonthlyStudentRow[];
  } | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Student calendar state
  const [calendarRecords, setCalendarRecords] = useState<CalendarRecord[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Load sections for staff
  useEffect(() => {
    if (isStudentOrParent) return;

    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const opts: { id: number; label: string }[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({ id: sec.id, label: `${cls.name} (${sec.name})` });
          }
        }
        setSections(opts);
        if (opts.length > 0) {
          setSelectedSectionId(String(opts[0].id));
        }
      })
      .catch(() => {});
  }, [isStudentOrParent]);

  // Load daily roster
  const loadRoster = useCallback(async () => {
    if (isStudentOrParent || !selectedSectionId || !selectedDate) return;
    setRosterLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/attendance?section_id=${selectedSectionId}&date=${selectedDate}`);
      if (res.ok) {
        const d = await res.json();
        setIsWorkingDay(d.isWorkingDay !== false);
        setClosedReason(d.closedReason || '');
        const list: RosterStudent[] = d.roster || [];
        setRoster(list);

        const initialMap: Record<number, { status: 'present' | 'absent' | 'late' | 'leave'; note: string }> = {};
        for (const s of list) {
          initialMap[s.enrollment_id] = {
            status: s.status || 'present',
            note: s.note || '',
          };
        }
        setAttendanceMap(initialMap);
      }
    } finally {
      setRosterLoading(false);
    }
  }, [selectedSectionId, selectedDate, isStudentOrParent]);

  // Load monthly report
  const loadMonthly = useCallback(async () => {
    if (isStudentOrParent || !selectedSectionId || !selectedMonth) return;
    setMonthlyLoading(true);
    try {
      const res = await fetch(`/api/attendance/monthly?section_id=${selectedSectionId}&month=${selectedMonth}`);
      if (res.ok) {
        const d = await res.json();
        setMonthlyData({
          totalWorkingDays: d.totalWorkingDays || 0,
          students: d.students || [],
        });
      }
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedSectionId, selectedMonth, isStudentOrParent]);

  // Load student calendar
  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch(`/api/attendance?month=${selectedMonth}`);
      if (res.ok) {
        const d = await res.json();
        setCalendarRecords(d.records || []);
      }
    } finally {
      setCalendarLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (mode === 'roster') loadRoster();
    else if (mode === 'monthly') loadMonthly();
    else if (mode === 'calendar') loadCalendar();
  }, [mode, loadRoster, loadMonthly, loadCalendar]);

  const handleStatusChange = (enrollmentId: number, status: 'present' | 'absent' | 'late' | 'leave') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
      },
    }));
  };

  const handleNoteChange = (enrollmentId: number, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    for (const s of roster) {
      if (updated[s.enrollment_id]?.status !== 'leave') {
        updated[s.enrollment_id] = {
          ...updated[s.enrollment_id],
          status: 'present',
        };
      }
    }
    setAttendanceMap(updated);
  };

  const handleSaveRoster = async () => {
    if (!selectedSectionId || !selectedDate) return;
    setSaving(true);
    setMessage(null);

    const records = roster.map((s) => ({
      enrollment_id: s.enrollment_id,
      status: attendanceMap[s.enrollment_id]?.status || 'present',
      note: attendanceMap[s.enrollment_id]?.note || '',
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: parseInt(selectedSectionId, 10),
          date: selectedDate,
          records,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Daily attendance saved successfully.' });
        loadRoster();
      } else {
        const d = await res.json();
        setMessage({ type: 'error', text: d.error || 'Failed to save attendance.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while saving attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const monthlyColumns: Column<MonthlyStudentRow>[] = [
    { key: 'roll_no', header: 'Roll No', render: (s: MonthlyStudentRow) => s.roll_no ?? '—' },
    { key: 'admission_no', header: 'Admission No', render: (s: MonthlyStudentRow) => <code>{s.admission_no}</code> },
    { key: 'full_name', header: 'Student Name', render: (s: MonthlyStudentRow) => <strong>{s.full_name}</strong> },
    { key: 'present', header: 'Present', render: (s: MonthlyStudentRow) => <span style={{ color: '#137333', fontWeight: 600 }}>{s.present}</span> },
    { key: 'late', header: 'Late', render: (s: MonthlyStudentRow) => <span style={{ color: '#b06000' }}>{s.late}</span> },
    { key: 'absent', header: 'Absent', render: (s: MonthlyStudentRow) => <span style={{ color: '#c5221f', fontWeight: 600 }}>{s.absent}</span> },
    { key: 'leave', header: 'Leave', render: (s: MonthlyStudentRow) => <span style={{ color: '#1a73e8' }}>{s.leave}</span> },
    {
      key: 'percentage',
      header: 'Attendance %',
      render: (s: MonthlyStudentRow) => (
        <span style={{ fontWeight: 700, color: s.percentage >= 75 ? 'var(--ink)' : '#c5221f' }}>
          {s.percentage}%
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isStudentOrParent ? 'My Attendance Records' : 'Attendance Management'}
        description={
          isStudentOrParent
            ? 'Monthly attendance presence, late entries, and approved leave records.'
            : 'Daily class rosters, attendance recording, and monthly analytical reports.'
        }
      />

      {!isStudentOrParent && (
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === 'roster' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('roster')}
          >
            Take Daily Attendance
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'monthly' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('monthly')}
          >
            Monthly Section Report
          </button>
        </div>
      )}

      {message && (
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            background: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
            color: message.type === 'success' ? '#137333' : '#c5221f',
          }}
        >
          {message.text}
        </div>
      )}

      {/* MODE 1: DAILY ROSTER (Staff Only) */}
      {mode === 'roster' && !isStudentOrParent && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.controlGroup}>
              <label htmlFor="sec-select">Class & Section:</label>
              <select
                id="sec-select"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className={styles.selectInput}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="date-input">Attendance Date (AD):</label>
              <input
                id="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
              <span className={styles.bsDateHint}>BS: {formatBS(selectedDate)}</span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={!isWorkingDay}
                onClick={handleMarkAllPresent}
              >
                Mark All Present
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                disabled={!isWorkingDay || saving}
                onClick={handleSaveRoster}
              >
                {saving ? 'Saving...' : 'Save Daily Attendance'}
              </Button>
            </div>
          </div>

          {!isWorkingDay && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              <Icon name="alert-triangle" size={16} />
              <span><strong>School Closed ({closedReason || 'Non-working day'}):</strong> Attendance cannot be marked on weekly off days or holidays.</span>
            </div>
          )}

          {rosterLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
              Loading section roster...
            </div>
          ) : roster.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
              No active students enrolled in this section.
            </div>
          ) : (
            <div className={styles.rosterCard}>
              <table className={styles.rosterTable}>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Roll</th>
                    <th>Adm No</th>
                    <th>Student Name</th>
                    <th>Status Selection</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => {
                    const current = attendanceMap[s.enrollment_id] || { status: 'present', note: '' };
                    return (
                      <tr key={s.enrollment_id}>
                        <td><strong>{s.roll_no ?? '—'}</strong></td>
                        <td><code>{s.admission_no}</code></td>
                        <td>
                          <strong>{s.full_name}</strong>
                          {s.gender && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginLeft: 6 }}>
                              ({s.gender})
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusButtons}>
                            <button
                              type="button"
                              className={`${styles.statusBtn} ${styles.btnPresent} ${
                                current.status === 'present' ? styles.activePresent : ''
                              }`}
                              onClick={() => handleStatusChange(s.enrollment_id, 'present')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`${styles.statusBtn} ${styles.btnAbsent} ${
                                current.status === 'absent' ? styles.activeAbsent : ''
                              }`}
                              onClick={() => handleStatusChange(s.enrollment_id, 'absent')}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              className={`${styles.statusBtn} ${styles.btnLate} ${
                                current.status === 'late' ? styles.activeLate : ''
                              }`}
                              onClick={() => handleStatusChange(s.enrollment_id, 'late')}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              className={`${styles.statusBtn} ${styles.btnLeave} ${
                                current.status === 'leave' ? styles.activeLeave : ''
                              }`}
                              onClick={() => handleStatusChange(s.enrollment_id, 'leave')}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={current.note}
                            onChange={(e) => handleNoteChange(s.enrollment_id, e.target.value)}
                            className={styles.noteInput}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <Button variant="primary" loading={saving} onClick={handleSaveRoster}>
                  {saving ? 'Saving...' : 'Save Daily Attendance'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: MONTHLY REPORT (Staff Only) */}
      {mode === 'monthly' && !isStudentOrParent && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.controlGroup}>
              <label htmlFor="sec-month-select">Class & Section:</label>
              <select
                id="sec-month-select"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className={styles.selectInput}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="month-select">Month:</label>
              <input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <a
                href={`/api/attendance/export?section_id=${selectedSectionId}&month=${selectedMonth}`}
                download
              >
                <Button variant="secondary" size="sm">
                  Export Monthly CSV
                </Button>
              </a>
            </div>
          </div>

          {monthlyData && (
            <div className={styles.statsSummary}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Total School Days</span>
                <span className={styles.statNum}>{monthlyData.totalWorkingDays}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Enrolled Students</span>
                <span className={styles.statNum}>{monthlyData.students.length}</span>
              </div>
            </div>
          )}

          <DataTable<MonthlyStudentRow>
            columns={monthlyColumns}
            rows={monthlyData?.students || []}
            keyExtractor={(s) => s.enrollment_id}
            loading={monthlyLoading}
            emptyText="No attendance marked for this section in the selected month."
          />
        </div>
      )}

      {/* MODE 3: CALENDAR VIEW (Student & Parent View) */}
      {mode === 'calendar' && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.controlGroup}>
              <label htmlFor="cal-month-select">Select Month:</label>
              <input
                id="cal-month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>

          {calendarLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
              Loading calendar view...
            </div>
          ) : (
            <div className={styles.calendarContainer}>
              <div className={styles.calendarGrid}>
                {calendarRecords.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    No daily attendance records found for {selectedMonth}.
                  </div>
                ) : (
                  calendarRecords.map((r) => {
                    let badgeColor = '#137333';
                    if (r.status === 'absent') badgeColor = '#c5221f';
                    else if (r.status === 'late') badgeColor = '#b06000';
                    else if (r.status === 'leave') badgeColor = '#1a73e8';

                    return (
                      <div key={r.date} className={styles.calendarCard}>
                        <div className={styles.calDate}>{r.date}</div>
                        <div className={styles.calBs}>BS: {formatBS(r.date)}</div>
                        <div
                          className={styles.calStatusBadge}
                          style={{ backgroundColor: badgeColor }}
                        >
                          {r.status.toUpperCase()}
                        </div>
                        {r.note && <div className={styles.calNote}>{r.note}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
