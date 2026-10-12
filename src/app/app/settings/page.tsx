'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { WEEKDAYS_EN, WEEKDAYS_NE } from '@/lib/calendar';
import styles from './Settings.module.css';

interface SettingDef {
  key: string;
  group: string;
  label: string;
  labelNe?: string;
  help: string;
  type: string;
  defaultValue: string;
}

interface CalendarEvent {
  id: number;
  date: string;
  end_date: string | null;
  kind: string;
  title: string;
  title_ne: string | null;
  applies_to?: string | null;
  created_by_name: string | null;
}

interface HistoryItem {
  id: number;
  key: string;
  old_value: string | null;
  new_value: string;
  changed_by_name: string;
  reason: string | null;
  changed_at: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'attendance' | 'leave' | 'identity' | 'audit'>('calendar');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [registry, setRegistry] = useState<Record<string, SettingDef>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Event Modal
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: '',
    end_date: '',
    kind: 'holiday',
    title: '',
    title_ne: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSettings, resEvents] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/calendar/events'),
      ]);

      if (resSettings.ok) {
        const sData = await resSettings.json();
        setSettings(sData.settings || {});
        setRegistry(sData.registry || {});
        setHistory(sData.history || []);
      }

      if (resEvents.ok) {
        const eData = await resEvents.json();
        setEvents(eData.items || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSetting = async (key: string, value: string, reason?: string) => {
    setSavingKey(key);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save setting.');
      }
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSaveSuccess(`Setting "${registry[key]?.label || key}" saved successfully!`);
      setTimeout(() => setSaveSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to save setting.');
    } finally {
      setSavingKey(null);
    }
  };

  const getWeeklyOffArray = (): number[] => {
    try {
      const raw = settings['weekly_off_days'] || '[6]';
      return JSON.parse(raw);
    } catch {
      return [6];
    }
  };

  const toggleWeeklyOffDay = async (dow: number) => {
    const current = getWeeklyOffArray();
    let updated: number[];
    if (current.includes(dow)) {
      if (current.length === 1) {
        if (!confirm('Warning: School will have zero weekly off days. Do you wish to continue?')) {
          return;
        }
      }
      updated = current.filter((d) => d !== dow);
    } else {
      updated = [...current, dow].sort();
    }
    const val = JSON.stringify(updated);
    await updateSetting('weekly_off_days', val, `Updated weekly off days to: ${val}`);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.date || !newEvent.title) return;
    setEventSaving(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add calendar event.');
      }
      setEventModalOpen(false);
      setNewEvent({ date: '', end_date: '', kind: 'holiday', title: '', title_ne: '' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this calendar holiday / event?')) return;
    try {
      const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      alert('Failed to delete event.');
    }
  };

  const weeklyOff = getWeeklyOffArray();

  return (
    <div className={styles.container}>
      <PageHeader
        title="Admin Control Center & Institutional Settings"
        description="Full administrative oversight over school working days, attendance edit rules, leave policies, and institutional identity."
      />

      {saveSuccess && (
        <div className={styles.bannerNotice}>
          <Icon name="check-circle" size={16} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Control Center Subnav */}
      <div className={styles.hubsSection}>
        <span className={styles.hubsTitle}>Administrative Control Hubs</span>
        <div className={styles.hubsGrid}>
          <Link href="/app/settings/health" className={styles.hubLink}>
            <Icon name="activity" size={14} /> Health Audit
          </Link>
          <Link href="/app/settings/wizard" className={styles.hubLink}>
            <Icon name="wrench" size={14} /> Setup Wizard
          </Link>
          <Link href="/app/settings/permissions" className={styles.hubLink}>
            <Icon name="shield-check" size={14} /> Permissions
          </Link>
          <Link href="/app/settings/modules" className={styles.hubLink}>
            <Icon name="grid" size={14} /> Feature Modules
          </Link>
          <Link href="/app/settings/labels" className={styles.hubLink}>
            <Icon name="tag" size={14} /> Terminology
          </Link>
          <Link href="/app/settings/templates" className={styles.hubLink}>
            <Icon name="file-text" size={14} /> Templates
          </Link>
          <Link href="/app/settings/fields" className={styles.hubLink}>
            <Icon name="sliders" size={14} /> Lookups &amp; Fields
          </Link>
          <Link href="/app/settings/workflows" className={styles.hubLink}>
            <Icon name="sliders" size={14} /> Workflows
          </Link>
          <Link href="/app/settings/data" className={styles.hubLink}>
            <Icon name="database" size={14} /> Data Vault
          </Link>
          <Link href="/app/site/theme" className={styles.hubLink}>
            <Icon name="palette" size={14} /> Theme &amp; Branding
          </Link>
        </div>
      </div>

      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Icon name="calendar" size={14} /> Calendar &amp; Working Week
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Icon name="clock" size={14} /> Attendance Rules
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'leave' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <Icon name="leave" size={14} /> Leave Policy &amp; Quotas
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'identity' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <Icon name="building" size={14} /> School Identity
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Icon name="file-text" size={14} /> Audit History
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading administrative settings...
        </div>
      ) : (
        <>
          {/* TAB 1: CALENDAR & WORKING DAYS */}
          {activeTab === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>Weekly Working Days & School Off Days</h3>
                    <p className={styles.cardDesc}>
                      Click to toggle off days. Attendance and leave calculations dynamically respect this setting across the entire platform.
                    </p>
                  </div>
                  <Badge variant="info">
                    {weeklyOff.length === 0
                      ? 'No Off Days'
                      : `Closed on: ${weeklyOff.map((d) => WEEKDAYS_EN[d]).join(', ')}`}
                  </Badge>
                </div>

                <div className={styles.weekdayGrid}>
                  {WEEKDAYS_EN.map((dayName, idx) => {
                    const isOff = weeklyOff.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`${styles.weekdayCard} ${isOff ? styles.weekdayCardOff : ''}`}
                        onClick={() => toggleWeeklyOffDay(idx)}
                      >
                        <input
                          type="checkbox"
                          checked={isOff}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div className={styles.weekdayLabel}>{dayName}</div>
                          <div className={styles.weekdaySub}>
                            {WEEKDAYS_NE[idx]} • {isOff ? 'OFF DAY' : 'Open'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>Daily School Schedule Timings</h3>
                    <p className={styles.cardDesc}>Official reporting, assembly, and dismissal hours.</p>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <Field label="School Assembly / Start Time" hint="Official start time (NPT)">
                    <input
                      type="time"
                      value={settings['school_start_time'] || '09:00'}
                      onChange={(e) => setSettings({ ...settings, school_start_time: e.target.value })}
                      onBlur={(e) => updateSetting('school_start_time', e.target.value)}
                    />
                  </Field>
                  <Field label="School Dismissal Time" hint="Official dismissal time">
                    <input
                      type="time"
                      value={settings['school_end_time'] || '16:30'}
                      onChange={(e) => setSettings({ ...settings, school_end_time: e.target.value })}
                      onBlur={(e) => updateSetting('school_end_time', e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>School Calendar Holidays & Vacations</h3>
                    <p className={styles.cardDesc}>
                      Official holidays and vacation periods. Attendance recording is automatically blocked on these dates.
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => setEventModalOpen(true)}>
                    + Add Holiday / Vacation
                  </Button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.holidayTable}>
                    <thead>
                      <tr>
                        <th>Date Range</th>
                        <th>Type</th>
                        <th>Holiday Title (English / Nepali)</th>
                        <th>Applies To</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No holidays or vacations recorded for current academic year.
                          </td>
                        </tr>
                      ) : (
                        events.map((evt) => (
                          <tr key={evt.id}>
                            <td style={{ fontWeight: 600 }}>
                              {evt.date}
                              {evt.end_date && evt.end_date !== evt.date ? ` → ${evt.end_date}` : ''}
                            </td>
                            <td>
                              <Badge variant={evt.kind === 'vacation' ? 'warning' : 'neutral'}>
                                {evt.kind.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <div>{evt.title}</div>
                              {evt.title_ne && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{evt.title_ne}</div>}
                            </td>
                            <td>{evt.applies_to || 'All'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(evt.id)}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE RULES */}
          {activeTab === 'attendance' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Attendance Control & Enforcement Rules</h3>
                  <p className={styles.cardDesc}>
                    Controls the edit window for class teachers, late thresholds, and warning alerts.
                  </p>
                </div>
              </div>

              <div className={styles.grid2}>
                <Field
                  label="Teacher Attendance Edit Window (Days)"
                  hint="Number of days in the past a teacher can record or adjust attendance. Older dates require Principal override."
                >
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings['attendance_edit_window_days'] || '2'}
                    onChange={(e) => setSettings({ ...settings, attendance_edit_window_days: e.target.value })}
                    onBlur={(e) => updateSetting('attendance_edit_window_days', e.target.value)}
                  />
                </Field>

                <Field
                  label="Mark Arriving Students as Late After"
                  hint="Reporting time after which arrivals are flagged as Late."
                >
                  <input
                    type="time"
                    value={settings['late_after_time'] || '09:15'}
                    onChange={(e) => setSettings({ ...settings, late_after_time: e.target.value })}
                    onBlur={(e) => updateSetting('late_after_time', e.target.value)}
                  />
                </Field>

                <Field
                  label="Low Attendance Defaulter Threshold (%)"
                  hint="Percentage of attendance required to be in good standing."
                >
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={settings['low_attendance_threshold'] || '75'}
                    onChange={(e) => setSettings({ ...settings, low_attendance_threshold: e.target.value })}
                    onBlur={(e) => updateSetting('low_attendance_threshold', e.target.value)}
                  />
                </Field>

                <Field
                  label="Consecutive Absence Alert (Days)"
                  hint="Triggers priority warning to teachers when a student is absent consecutively."
                >
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={settings['consecutive_absence_alert_days'] || '3'}
                    onChange={(e) => setSettings({ ...settings, consecutive_absence_alert_days: e.target.value })}
                    onBlur={(e) => updateSetting('consecutive_absence_alert_days', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE POLICY */}
          {activeTab === 'leave' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Leave Management Policy & Approval Thresholds</h3>
                  <p className={styles.cardDesc}>
                    Defines approval escalation chains and requirements for medical notes.
                  </p>
                </div>
              </div>

              <div className={styles.grid2}>
                <Field
                  label="Max Student Leave Days Approvable by Class Teacher"
                  hint="Leave applications exceeding this length automatically route to the Principal for review."
                >
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings['max_student_leave_days_teacher'] || '3'}
                    onChange={(e) => setSettings({ ...settings, max_student_leave_days_teacher: e.target.value })}
                    onBlur={(e) => updateSetting('max_student_leave_days_teacher', e.target.value)}
                  />
                </Field>

                <Field
                  label="Medical Certificate Required After (Days)"
                  hint="Sick leaves exceeding this duration mandate medical documentation."
                >
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings['require_medical_attachment_days'] || '2'}
                    onChange={(e) => setSettings({ ...settings, require_medical_attachment_days: e.target.value })}
                    onBlur={(e) => updateSetting('require_medical_attachment_days', e.target.value)}
                  />
                </Field>
              </div>

              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Standard Approval Hierarchy:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                  <li><strong>Student Leaves (≤ {settings['max_student_leave_days_teacher'] || 3} days):</strong> Reviewed by designated Section Class Teacher.</li>
                  <li><strong>Student Leaves (&gt; {settings['max_student_leave_days_teacher'] || 3} days):</strong> Escalated to Principal.</li>
                  <li><strong>Teacher &amp; Staff Leaves:</strong> Submitted to and reviewed by Principal.</li>
                  <li><strong>Principal Leaves:</strong> Submitted to and reviewed by Administrator.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SCHOOL IDENTITY */}
          {activeTab === 'identity' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Institutional Profile & Headers</h3>
                  <p className={styles.cardDesc}>
                    Displayed on official student marksheets, fee receipts, and portal banners.
                  </p>
                </div>
              </div>

              <div className={styles.grid2}>
                <Field label="School Name (English)">
                  <input
                    type="text"
                    value={settings['school_name'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                    onBlur={(e) => updateSetting('school_name', e.target.value)}
                  />
                </Field>

                <Field label="School Name (Nepali)">
                  <input
                    type="text"
                    value={settings['school_name_ne'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_name_ne: e.target.value })}
                    onBlur={(e) => updateSetting('school_name_ne', e.target.value)}
                  />
                </Field>

                <Field label="School Motto">
                  <input
                    type="text"
                    value={settings['school_motto'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_motto: e.target.value })}
                    onBlur={(e) => updateSetting('school_motto', e.target.value)}
                  />
                </Field>

                <Field label="Principal Name">
                  <input
                    type="text"
                    value={settings['principal_name'] || ''}
                    onChange={(e) => setSettings({ ...settings, principal_name: e.target.value })}
                    onBlur={(e) => updateSetting('principal_name', e.target.value)}
                  />
                </Field>

                <Field label="Campus Address">
                  <input
                    type="text"
                    value={settings['school_address'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_address: e.target.value })}
                    onBlur={(e) => updateSetting('school_address', e.target.value)}
                  />
                </Field>

                <Field label="Contact Phone">
                  <input
                    type="text"
                    value={settings['school_phone'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_phone: e.target.value })}
                    onBlur={(e) => updateSetting('school_phone', e.target.value)}
                  />
                </Field>

                <Field label="Official Email">
                  <input
                    type="text"
                    value={settings['school_email'] || ''}
                    onChange={(e) => setSettings({ ...settings, school_email: e.target.value })}
                    onBlur={(e) => updateSetting('school_email', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Configuration Change History</h3>
                  <p className={styles.cardDesc}>
                    Complete audit trail of setting modifications, previous values, and administrative actors.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.holidayTable}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Setting Key</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Changed By</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No changes recorded in history yet.
                        </td>
                      </tr>
                    ) : (
                      history.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{h.changed_at}</td>
                          <td style={{ fontWeight: 600 }}>{h.key}</td>
                          <td style={{ color: '#dc2626' }}>{h.old_value || '—'}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{h.new_value}</td>
                          <td>{h.changed_by_name || 'System'}</td>
                          <td style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{h.reason || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD HOLIDAY DIALOG */}
      <Dialog
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Add School Holiday or Vacation"
      >
        <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Start Date (YYYY-MM-DD)" required>
            <input
              type="date"
              required
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
          </Field>

          <Field label="End Date (optional for multi-day vacation)">
            <input
              type="date"
              value={newEvent.end_date}
              onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
            />
          </Field>

          <Field label="Event Type" required>
            <select
              value={newEvent.kind}
              onChange={(e) => setNewEvent({ ...newEvent, kind: e.target.value })}
            >
              <option value="holiday">Official Holiday</option>
              <option value="vacation">Vacation Period (e.g. Dashain/Summer)</option>
              <option value="event">School Event / Sports</option>
              <option value="half_day">Half Day</option>
              <option value="working_override">Working Day Override (Make-up Class)</option>
            </select>
          </Field>

          <Field label="Title (English)" required>
            <input
              type="text"
              required
              placeholder="e.g. Dashain Festival Vacation"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </Field>

          <Field label="Title (Nepali)">
            <input
              type="text"
              placeholder="e.g. बडा दसैं बिदा"
              value={newEvent.title_ne}
              onChange={(e) => setNewEvent({ ...newEvent, title_ne: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={eventSaving}>
              {eventSaving ? 'Saving...' : 'Add to Calendar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
