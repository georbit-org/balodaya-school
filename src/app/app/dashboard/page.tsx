'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className={styles.container}>
        <PageHeader title="Dashboard" description="Loading overview data..." />
      </div>
    );
  }

  const role = data.role;

  // ================= ADMIN & PRINCIPAL VIEW =================
  if (role === 'admin' || role === 'principal') {
    const stats = data.stats || {};
    return (
      <div className={styles.container}>
        <PageHeader
          title="Institutional Overview"
          description="Real-time admissions, attendance counts, financial dues, and academic schedules."
        />

        {stats.unmarked_sections_today > 0 && (
          <div className={styles.warningBanner}>
            <span>
              <strong>Attendance Alert:</strong> Daily attendance has not yet been submitted for {stats.unmarked_sections_today} section(s) today.
            </span>
            <Link href="/app/attendance">
              <Button variant="secondary" size="sm">
                Take Attendance &rarr;
              </Button>
            </Link>
          </div>
        )}

        <div className={styles.statGrid}>
          <Stat
            label="Enrolled Students"
            value={stats.total_students}
            subtext="Active learners"
            href="/app/students"
          />
          <Stat
            label="New Applications"
            value={stats.new_applications}
            subtext="Pending admissions review"
            href="/app/applications"
          />
          <Stat
            label="Absent Today"
            value={stats.absent_today}
            subtext="Recorded student absences"
            href="/app/attendance"
          />
          <Stat
            label="Outstanding Dues"
            value={`NPR ${stats.outstanding_dues?.toLocaleString() || 0}`}
            subtext="Unpaid fee balances"
            href="/app/fees"
          />
        </div>

        <div className={styles.dashboardGrid}>
          {/* Upcoming Examinations */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>Upcoming Examinations</span>
              <Link href="/app/exams" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                All Exams &rarr;
              </Link>
            </div>
            <ul className={styles.itemList}>
              {data.upcoming_exams && data.upcoming_exams.length > 0 ? (
                data.upcoming_exams.map((ex: any) => (
                  <li key={ex.id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{ex.name}</div>
                      <div className={styles.itemMeta}>
                        {ex.start_date ? `Starts: ${ex.start_date}` : 'Schedule in preparation'}
                      </div>
                    </div>
                    <Link href={`/app/exams?examId=${ex.id}`}>
                      <Button variant="secondary" size="sm">View Schedule</Button>
                    </Link>
                  </li>
                ))
              ) : (
                <li style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No upcoming exams scheduled.</li>
              )}
            </ul>
          </div>

          {/* Latest Circulars & Notices */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>Latest Notices &amp; Circulars</span>
              <Link href="/app/notices" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                All Notices &rarr;
              </Link>
            </div>
            <ul className={styles.itemList}>
              {data.latest_notices && data.latest_notices.length > 0 ? (
                data.latest_notices.map((n: any) => (
                  <li key={n.id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemMeta}>
                        {n.created_at?.slice(0, 10)} &bull; {n.kind === 'event' ? 'Event' : 'Notice'}
                      </div>
                    </div>
                    <Link href="/app/notices">
                      <Button variant="secondary" size="sm">Details</Button>
                    </Link>
                  </li>
                ))
              ) : (
                <li style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No notices published yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ================= TEACHER VIEW =================
  if (role === 'teacher') {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Teacher Dashboard"
          description="Class responsibilities, today's teaching timetable, pending marks, and leave requests."
        />

        <div className={styles.statGrid}>
          <Stat
            label="Assigned Class Sections"
            value={data.my_sections?.length || 0}
            subtext="Class teacher role"
            href="/app/attendance"
          />
          <Stat
            label="Pending Leave Requests"
            value={data.pending_leaves_count || 0}
            subtext="Awaiting review"
            href="/app/leave"
          />
          <Stat
            label="Classes Today"
            value={data.timetable_today?.length || 0}
            subtext="Teaching periods"
            href="/app/timetable"
          />
        </div>

        <div className={styles.dashboardGrid}>
          {/* Class Teacher Section Attendance */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>Daily Attendance Status</span>
              <Link href="/app/attendance" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                Attendance Roster &rarr;
              </Link>
            </div>
            <ul className={styles.itemList}>
              {data.my_sections && data.my_sections.length > 0 ? (
                data.my_sections.map((sec: any) => (
                  <li key={sec.section_id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{sec.class_name} ({sec.section_name})</div>
                      <div className={styles.itemMeta}>
                        Status: <strong>{sec.marked_today > 0 ? 'Submitted Today' : 'Not yet taken'}</strong>
                      </div>
                    </div>
                    <Link href={`/app/attendance`}>
                      <Button variant="secondary" size="sm">
                        {sec.marked_today > 0 ? 'Edit' : 'Take Attendance'}
                      </Button>
                    </Link>
                  </li>
                ))
              ) : (
                <li style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>You are not designated as class teacher for any section.</li>
              )}
            </ul>
          </div>

          {/* Today's Timetable */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>Today&apos;s Teaching Schedule</span>
              <Link href="/app/timetable" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                Full Timetable &rarr;
              </Link>
            </div>
            {data.timetable_today && data.timetable_today.length > 0 ? (
              <div className={styles.timetableGrid}>
                {data.timetable_today.map((slot: any, idx: number) => (
                  <div key={idx} className={styles.timetableCard}>
                    <span className={styles.periodBadge}>Period {slot.period}</span>
                    <span className={styles.subjectName}>{slot.subject_name}</span>
                    <span className={styles.timeText}>{slot.class_name} ({slot.section_name})</span>
                    {slot.start_time && <span className={styles.timeText}>{slot.start_time} - {slot.end_time}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No scheduled teaching periods for today.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= ACCOUNTANT VIEW =================
  if (role === 'accountant') {
    const stats = data.stats || {};
    return (
      <div className={styles.container}>
        <PageHeader
          title="Finance & Cashier Dashboard"
          description="Daily collections, monthly revenue totals, and student fee receivables."
        />

        <div className={styles.statGrid}>
          <Stat
            label="Collected Today"
            value={`NPR ${stats.collected_today?.toLocaleString() || 0}`}
            subtext="Cash & digital deposits"
            href="/app/fees"
          />
          <Stat
            label="Collected This Month"
            value={`NPR ${stats.collected_this_month?.toLocaleString() || 0}`}
            subtext="Cumulative monthly fee revenue"
            href="/app/fees"
          />
          <Stat
            label="Total Receivables"
            value={`NPR ${stats.outstanding_total?.toLocaleString() || 0}`}
            subtext="Outstanding student dues"
            href="/app/fees"
          />
          <Stat
            label="Overdue Invoices"
            value={stats.overdue_invoices_count || 0}
            subtext="Past designated due date"
            href="/app/fees"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <span>Recent Payments</span>
            <Link href="/app/fees" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
              Fee Ledger &rarr;
            </Link>
          </div>
          <ul className={styles.itemList}>
            {data.recent_payments && data.recent_payments.length > 0 ? (
              data.recent_payments.map((p: any) => (
                <li key={p.id} className={styles.itemRow}>
                  <div>
                    <div className={styles.itemTitle}>{p.student_name} ({p.admission_no})</div>
                    <div className={styles.itemMeta}>Receipt: {p.receipt_no} &bull; {p.payment_date} &bull; {p.payment_method}</div>
                  </div>
                  <div>
                    <strong>NPR {p.amount?.toLocaleString()}</strong>
                  </div>
                </li>
              ))
            ) : (
              <li style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No recent payments recorded.</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // ================= PARENT VIEW =================
  if (role === 'parent') {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Parent Portal"
          description="Academic progress, attendance percentage, and fee balances for your children."
        />

        <div className={styles.dashboardGrid}>
          {data.children && data.children.length > 0 ? (
            data.children.map((child: any) => (
              <div key={child.id} className={styles.childCard}>
                <div className={styles.childHeader}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{child.full_name}</h2>
                    <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                      Adm: {child.admission_no} &bull; {child.class_name} ({child.section_name})
                    </span>
                  </div>
                  <Link href={`/app/students/${child.id}`}>
                    <Button variant="secondary" size="sm">Full Profile &rarr;</Button>
                  </Link>
                </div>

                <div className={styles.childStats}>
                  <Stat
                    label="Monthly Attendance"
                    value={child.attendance_percent !== null ? `${child.attendance_percent}%` : 'Not marked'}
                    subtext="School attendance this month"
                  />
                  <Stat
                    label="Outstanding Fees"
                    value={`NPR ${child.fees_due?.toLocaleString() || 0}`}
                    subtext={child.fees_due > 0 ? 'Dues balance' : 'All clear'}
                  />
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--ink-soft)' }}>No children currently linked to your parent portal account.</p>
          )}
        </div>

        {/* Notices */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>School Notices &amp; Announcements</div>
          <ul className={styles.itemList}>
            {data.latest_notices && data.latest_notices.length > 0 ? (
              data.latest_notices.map((n: any) => (
                <li key={n.id} className={styles.itemRow}>
                  <div>
                    <div className={styles.itemTitle}>{n.title}</div>
                    <div className={styles.itemMeta}>{n.created_at?.slice(0, 10)}</div>
                  </div>
                </li>
              ))
            ) : (
              <li style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No notices published yet.</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // ================= STUDENT VIEW =================
  if (role === 'student') {
    const student = data.student;
    return (
      <div className={styles.container}>
        <PageHeader
          title={`Welcome, ${student?.full_name || 'Student'}`}
          description={`Class: ${student?.class_name || '—'} (${student?.section_name || '—'}) • Admission No: ${student?.admission_no || '—'}`}
        />

        <div className={styles.statGrid}>
          <Stat
            label="My Attendance"
            value={data.attendance_percent !== null ? `${data.attendance_percent}%` : '—'}
            subtext="This month"
          />
          <Stat
            label="Fee Dues"
            value={`NPR ${data.fees_due?.toLocaleString() || 0}`}
            subtext="Current balance"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Today&apos;s Class Timetable</div>
          {data.timetable_today && data.timetable_today.length > 0 ? (
            <div className={styles.timetableGrid}>
              {data.timetable_today.map((slot: any, idx: number) => (
                <div key={idx} className={styles.timetableCard}>
                  <span className={styles.periodBadge}>Period {slot.period}</span>
                  <span className={styles.subjectName}>{slot.subject_name}</span>
                  <span className={styles.timeText}>{slot.teacher_name || 'Teacher'}</span>
                  {slot.start_time && <span className={styles.timeText}>{slot.start_time} - {slot.end_time}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>No classes scheduled for today.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Dashboard" description="Welcome to the Balodaya School Portal." />
    </div>
  );
}
