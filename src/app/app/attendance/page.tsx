'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { KeyHint } from '@/components/ui/KeyHint';
import { adToBs } from '@/lib/bs-date';
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
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const [mode, setMode] = useState<'roster' | 'monthly' | 'calendar'>('roster');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Sections dropdown
  const [sections, setSections] = useState<{ id: number; label: string }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Daily roster state
  const [roster, setRoster] = useState<RosterStudent[]>([]);
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

  // Load sections on mount
  useEffect(() => {
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
  }, []);

  // Load daily roster
  const loadRoster = useCallback(async () => {
    if (!selectedSectionId || !selectedDate) return;
    setRosterLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/attendance?section_id=${selectedSectionId}&date=${selectedDate}`);
      if (res.ok) {
        const d = await res.json();
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
  }, [selectedSectionId, selectedDate]);

  // Load monthly report
  const loadMonthly = useCallback(async () => {
    if (!selectedSectionId || !selectedMonth) return;
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
  }, [selectedSectionId, selectedMonth]);

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
    if (mode === 'roster') {
      loadRoster();
    } else if (mode === 'monthly') {
      loadMonthly();
    } else if (mode === 'calendar') {
      loadCalendar();
    }
  }, [mode, loadRoster, loadMonthly, loadCalendar]);

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    for (const s of roster) {
      updated[s.enrollment_id] = {
        ...(updated[s.enrollment_id] || { note: '' }),
        status: 'present',
      };
    }
    setAttendanceMap(updated);
  };

  const handleStatusChange = (enrollmentId: number, status: 'present' | 'absent' | 'late' | 'leave') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || { note: '' }),
        status,
      },
    }));
  };

  const handleNoteChange = (enrollmentId: number, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || { status: 'present' }),
        note,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId || !selectedDate) return;
    setSaving(true);
    setMessage(null);

    const entries = roster.map((s) => ({
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
          entries,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Attendance saved successfully for ${selectedDate}.` });
        loadRoster();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save attendance.' });
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
        title="Attendance Management"
        description="Daily class rosters, attendance recording, and monthly analytical reports."
      />

      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === 'roster' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('roster')}
        >
          Daily Roster
        </button>
        <button
          className={`${styles.modeTab} ${mode === 'monthly' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('monthly')}
        >
          Monthly Report
        </button>
        <button
          className={`${styles.modeTab} ${mode === 'calendar' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('calendar')}
        >
          My Calendar View
        </button>
      </div>

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

      {/* Mode 1: Daily Roster */}
      {mode === 'roster' && (
        <div>
          <div className={styles.topControlBar}>
            <div className={styles.controlItem}>
              <label htmlFor="section-select">Section:</label>
              <select
                id="section-select"
                className={styles.inputControl}
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlItem}>
              <label htmlFor="date-select">Date:</label>
              <input
                id="date-select"
                type="date"
                max={today}
                className={styles.inputControl}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sky-deep)', background: 'var(--sky-wash)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--sky-border)' }}>
                {adToBs(selectedDate).displayEn} ({adToBs(selectedDate).displayNe})
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <Button variant="secondary" size="sm" onClick={handleMarkAllPresent}>
                Mark All Present
              </Button>
            </div>
          </div>

          {rosterLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading section roster...</div>
          ) : roster.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              No active students enrolled in this section.
            </div>
          ) : (
            <div>
              <table className={styles.rosterTable}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Roll</th>
                    <th style={{ width: '130px' }}>Admission No</th>
                    <th>Student Name</th>
                    <th style={{ width: '320px' }}>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => {
                    const currentVal = attendanceMap[s.enrollment_id] || { status: 'present', note: '' };
                    return (
                      <tr key={s.enrollment_id}>
                        <td>{s.roll_no ?? '—'}</td>
                        <td><code>{s.admission_no}</code></td>
                        <td><strong>{s.full_name}</strong></td>
                        <td>
                          <div className={styles.radioGroup}>
                            <label className={`${styles.radioLabel} ${styles.radioPresent}`}>
                              <input
                                type="radio"
                                name={`status-${s.enrollment_id}`}
                                value="present"
                                checked={currentVal.status === 'present'}
                                onChange={() => handleStatusChange(s.enrollment_id, 'present')}
                              />
                              Present
                            </label>
                            <label className={`${styles.radioLabel} ${styles.radioAbsent}`}>
                              <input
                                type="radio"
                                name={`status-${s.enrollment_id}`}
                                value="absent"
                                checked={currentVal.status === 'absent'}
                                onChange={() => handleStatusChange(s.enrollment_id, 'absent')}
                              />
                              Absent
                            </label>
                            <label className={`${styles.radioLabel} ${styles.radioLate}`}>
                              <input
                                type="radio"
                                name={`status-${s.enrollment_id}`}
                                value="late"
                                checked={currentVal.status === 'late'}
                                onChange={() => handleStatusChange(s.enrollment_id, 'late')}
                              />
                              Late
                            </label>
                            <label className={`${styles.radioLabel} ${styles.radioLeave}`}>
                              <input
                                type="radio"
                                name={`status-${s.enrollment_id}`}
                                value="leave"
                                checked={currentVal.status === 'leave'}
                                onChange={() => handleStatusChange(s.enrollment_id, 'leave')}
                              />
                              Leave
                            </label>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Optional note"
                            className={styles.noteInput}
                            value={currentVal.note}
                            onChange={(e) => handleNoteChange(s.enrollment_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className={styles.bottomActionRow}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                  {roster.length} students on roster for {selectedDate}
                </span>
                <Button variant="primary" onClick={handleSaveAttendance} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Monthly Report */}
      {mode === 'monthly' && (
        <div>
          <div className={styles.topControlBar}>
            <div className={styles.controlItem}>
              <label htmlFor="monthly-section-select">Section:</label>
              <select
                id="monthly-section-select"
                className={styles.inputControl}
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlItem}>
              <label htmlFor="month-select">Month:</label>
              <input
                id="month-select"
                type="month"
                className={styles.inputControl}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            {selectedSectionId && (
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
            )}
          </div>

          {monthlyLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading monthly summary...</div>
          ) : monthlyData ? (
            <div>
              <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                Recorded working days in this month: <strong>{monthlyData.totalWorkingDays} days</strong>
              </div>
              <DataTable<MonthlyStudentRow>
                columns={monthlyColumns}
                rows={monthlyData.students}
                keyExtractor={(s) => s.enrollment_id}
                emptyText="No attendance recorded for this section and month."
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Mode 3: Student / Parent Calendar View */}
      {mode === 'calendar' && (
        <div>
          <div className={styles.topControlBar}>
            <div className={styles.controlItem}>
              <label htmlFor="cal-month-select">Month:</label>
              <input
                id="cal-month-select"
                type="month"
                className={styles.inputControl}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          {calendarLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading attendance log...</div>
          ) : calendarRecords.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              No attendance records found for {selectedMonth}.
            </div>
          ) : (
            <div className={styles.calendarGrid}>
              {calendarRecords.map((r) => (
                <div key={r.date} className={styles.calendarCard}>
                  <div className={styles.calendarDate}>{r.date}</div>
                  <strong
                    style={{
                      textTransform: 'capitalize',
                      color:
                        r.status === 'present'
                          ? '#137333'
                          : r.status === 'absent'
                          ? '#c5221f'
                          : r.status === 'late'
                          ? '#b06000'
                          : '#1a73e8',
                    }}
                  >
                    {r.status}
                  </strong>
                  {r.note && <small style={{ color: 'var(--ink-muted)' }}>{r.note}</small>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
