'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { Timeline } from '@/components/ui/Timeline';
import { Icon } from '@/components/ui/Icon';
import { adToBs } from '@/lib/bs-date';
import { formatNpr } from '@/lib/format';
import type { DashboardResponse } from '@/server/services/dashboard';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
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
        <PageHeader title="Dashboard" description="Loading Balodaya institutional overview..." />
      </div>
    );
  }

  const role = data.role;
  const todayBs = adToBs(new Date());
  const todayAdStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const renderDateBar = () => (
    <div className={styles.dateBar}>
      <div className={styles.dateGroup}>
        <Icon name="calendar" width={15} height={15} color="var(--sky-deep)" />
        <span className={styles.dateBadge}>
          {todayBs.displayEn} ({todayBs.displayNe})
        </span>
        <span>&bull;</span>
        <span>{todayAdStr}</span>
      </div>
      <span>Balodaya Secondary School &bull; Bheerkot-06, Syangja</span>
    </div>
  );

  // ================= ADMIN & PRINCIPAL VIEW =================
  if (role === 'admin' || role === 'principal') {
    const stats = data.stats || {};
    return (
      <div className={styles.container}>
        <PageHeader
          title="Institutional Dashboard"
          description="Real-time admissions, student attendance, financial receivables, and school operations."
          actions={
            <Link href="/app/students">
              <Button variant="primary" size="sm">
                <Icon name="students" width={14} height={14} /> Directory
              </Button>
            </Link>
          }
        />

        {renderDateBar()}

        {/* Needs Attention Strip */}
        {data.needsAttention && data.needsAttention.length > 0 && (
          <div className={styles.attentionSection}>
            <div className={styles.attentionTitle}>Action Items Requiring Attention</div>
            <div className={styles.attentionGrid}>
              {data.needsAttention.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${styles.attentionCard} ${styles[item.badgeVariant]}`}
                >
                  <div className={styles.attentionContent}>
                    <span className={styles.attentionCount}>{item.count}</span>
                    <span>{item.label}</span>
                  </div>
                  <Icon name="chevron-right" width={14} height={14} color="var(--ink-soft)" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Key Statistics Grid */}
        <div className={styles.statGrid}>
          <Stat
            label="Enrolled Students"
            value={Number(stats.total_students || 0)}
            subtext="Active learners across nursery–10"
            href="/app/students"
          />
          <Stat
            label="New Applications"
            value={Number(stats.new_applications || 0)}
            subtext="Online admissions awaiting verification"
            href="/app/applications"
          />
          <Stat
            label="Absent Today"
            value={Number(stats.absent_today || 0)}
            subtext="Students marked absent on roll"
            href="/app/attendance"
          />
          <Stat
            label="Outstanding Dues"
            value={formatNpr(Number(stats.outstanding_dues || 0))}
            subtext="Unpaid school fee balances"
            href="/app/payments"
          />
        </div>

        {/* Visual Charts Grid: Attendance & Fee Collections */}
        <div className={styles.chartsGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="check" width={16} height={16} color="var(--sky-accent)" />
                Weekly Student Attendance Rate
              </h2>
              <Link href="/app/attendance" className={styles.panelAction}>
                Full Roster <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              {data.attendanceChart && (
                <BarChart
                  data={data.attendanceChart}
                  height={170}
                  valueFormatter={(v) => `${v}%`}
                  title="Weekly Student Attendance Percentage"
                />
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="receipt" width={16} height={16} color="var(--sky-accent)" />
                Fee Invoicing & Collections
              </h2>
              <Link href="/app/payments" className={styles.panelAction}>
                Ledger <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              {data.feeDonut && (
                <DonutChart
                  segments={data.feeDonut}
                  centerSub="Invoices"
                  size={140}
                  strokeWidth={14}
                />
              )}
            </div>
          </div>
        </div>

        {/* House System Leaderboard */}
        {data.houseStandings && data.houseStandings.length > 0 && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="houses" width={16} height={16} color="#F59E0B" />
                Inter-House Championship Standings
              </h2>
              <Link href="/app/houses" className={styles.panelAction}>
                Manage Points <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.houseGrid}>
                {data.houseStandings.map((h) => (
                  <div
                    key={h.name}
                    className={styles.houseCard}
                    style={{ ['--house-color' as string]: h.color }}
                  >
                    <span className={styles.houseName}>{h.name} House</span>
                    <span className={styles.housePoints}>{h.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Operations Panels: Upcoming Exams & Live Audit Timeline */}
        <div className={styles.dashboardGrid}>
          {/* Upcoming Examinations */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="calendar" width={16} height={16} color="var(--sky-accent)" />
                Upcoming Examinations
              </h2>
              <Link href="/app/exams" className={styles.panelAction}>
                Exam Control <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              <ul className={styles.itemList}>
                {data.upcoming_exams && data.upcoming_exams.length > 0 ? (
                  data.upcoming_exams.map((ex) => (
                    <li key={ex.id} className={styles.itemRow}>
                      <div>
                        <div className={styles.itemTitle}>{ex.name}</div>
                        <div className={styles.itemMeta}>
                          {ex.start_date ? `Starts: ${ex.start_date}` : 'Schedule in preparation'}
                        </div>
                      </div>
                      <Link href={`/app/exams?examId=${ex.id}`}>
                        <Button variant="secondary" size="sm">
                          Schedule
                        </Button>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className={styles.emptyState}>No upcoming exams scheduled.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Institutional Audit Timeline */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="reports" width={16} height={16} color="var(--sky-accent)" />
                Institutional Audit Activity
              </h2>
              <Link href="/app/settings/audit-log" className={styles.panelAction}>
                Full Log <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              {data.recentAudit && data.recentAudit.length > 0 ? (
                <Timeline events={data.recentAudit} />
              ) : (
                <div className={styles.emptyState}>No recent audit activities logged.</div>
              )}
            </div>
          </div>
        </div>

        {/* Latest Circulars & Notices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Icon name="notices" width={16} height={16} color="var(--sky-accent)" />
              Latest Official Notices &amp; Circulars
            </h2>
            <Link href="/app/notices" className={styles.panelAction}>
              Notice Board <Icon name="chevron-right" width={12} height={12} />
            </Link>
          </div>
          <div className={styles.panelBody}>
            <ul className={styles.itemList}>
              {data.latest_notices && data.latest_notices.length > 0 ? (
                data.latest_notices.map((n) => (
                  <li key={n.id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemMeta}>
                        {n.created_at?.slice(0, 10)} &bull; {n.kind === 'event' ? 'Campus Event' : 'General Notice'}
                      </div>
                    </div>
                    <Link href="/app/notices">
                      <Button variant="secondary" size="sm">
                        View Notice
                      </Button>
                    </Link>
                  </li>
                ))
              ) : (
                <li className={styles.emptyState}>No official notices published yet.</li>
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
          description="Class responsibilities, today's teaching timetable, pending marks, and student leaves."
          actions={
            <Link href="/app/attendance">
              <Button variant="primary" size="sm">
                <Icon name="check" width={14} height={14} /> Take Attendance
              </Button>
            </Link>
          }
        />

        {renderDateBar()}

        <div className={styles.statGrid}>
          <Stat
            label="Designated Classes"
            value={data.my_sections?.length || 0}
            subtext="Class teacher role"
            href="/app/attendance"
          />
          <Stat
            label="Pending Leaves"
            value={data.leave_requests?.length || 0}
            subtext="Awaiting teacher review"
            href="/app/leave"
          />
          <Stat
            label="Teaching Periods Today"
            value={data.timetable_today?.length || 0}
            subtext="Scheduled teaching slots"
            href="/app/timetable"
          />
        </div>

        <div className={styles.dashboardGrid}>
          {/* Class Teacher Section Attendance */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="check" width={16} height={16} color="var(--sky-accent)" />
                Daily Attendance Roster
              </h2>
              <Link href="/app/attendance" className={styles.panelAction}>
                Full Register <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              <ul className={styles.itemList}>
                {data.my_sections && data.my_sections.length > 0 ? (
                  data.my_sections.map((sec) => (
                    <li key={sec.section_id} className={styles.itemRow}>
                      <div>
                        <div className={styles.itemTitle}>
                          {sec.class_name} ({sec.section_name})
                        </div>
                        <div className={styles.itemMeta}>
                          {sec.marked_today > 0 ? (
                            <Badge variant="success">Submitted Today</Badge>
                          ) : (
                            <Badge variant="warning">Pending Submission</Badge>
                          )}
                        </div>
                      </div>
                      <Link href="/app/attendance">
                        <Button variant="secondary" size="sm">
                          {sec.marked_today > 0 ? 'Edit' : 'Take Attendance'}
                        </Button>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className={styles.emptyState}>You are not designated as class teacher for any section.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Today's Teaching Timetable */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="calendar" width={16} height={16} color="var(--sky-accent)" />
                Today&apos;s Teaching Schedule
              </h2>
              <Link href="/app/timetable" className={styles.panelAction}>
                Full Timetable <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              {data.timetable_today && data.timetable_today.length > 0 ? (
                <div className={styles.timetableGrid}>
                  {data.timetable_today.map((slot, idx) => (
                    <div key={idx} className={styles.timetableCard}>
                      <span className={styles.periodBadge}>Period {slot.period}</span>
                      <span className={styles.subjectName}>{slot.subject_name}</span>
                      <span className={styles.timeText}>
                        {slot.class_name} ({slot.section_name})
                      </span>
                      {slot.start_time && (
                        <span className={styles.timeText}>
                          {slot.start_time} - {slot.end_time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No scheduled teaching periods for today.</div>
              )}
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Icon name="notices" width={16} height={16} color="var(--sky-accent)" />
              Staff Notices &amp; Circulars
            </h2>
          </div>
          <div className={styles.panelBody}>
            <ul className={styles.itemList}>
              {data.latest_notices && data.latest_notices.length > 0 ? (
                data.latest_notices.map((n) => (
                  <li key={n.id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemMeta}>{n.created_at?.slice(0, 10)}</div>
                    </div>
                    <Link href="/app/notices">
                      <Button variant="secondary" size="sm">Details</Button>
                    </Link>
                  </li>
                ))
              ) : (
                <li className={styles.emptyState}>No notices currently published.</li>
              )}
            </ul>
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
          title="Finance &amp; Cashier Dashboard"
          description="Daily collections, monthly revenue totals, student fee receivables, and receipts."
          actions={
            <Link href="/app/payments">
              <Button variant="primary" size="sm">
                <Icon name="plus" width={14} height={14} /> Record Payment
              </Button>
            </Link>
          }
        />

        {renderDateBar()}

        <div className={styles.statGrid}>
          <Stat
            label="Collected Today"
            value={formatNpr(Number(stats.today_collection || stats.collected_today || 0))}
            subtext="Cash & digital deposits"
            href="/app/payments"
          />
          <Stat
            label="Collected This Month"
            value={formatNpr(Number(stats.month_collection || stats.collected_this_month || 0))}
            subtext="Cumulative monthly fee revenue"
            href="/app/payments"
          />
          <Stat
            label="Total Receivables"
            value={formatNpr(Number(stats.outstanding_dues || stats.outstanding_total || 0))}
            subtext="Outstanding student dues"
            href="/app/fees"
          />
          <Stat
            label="Receipts Issued Today"
            value={Number(stats.today_receipts_count || 0)}
            subtext="Vouchers generated"
            href="/app/payments"
          />
        </div>

        {/* Charts & Recent Payments */}
        <div className={styles.chartsGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="receipt" width={16} height={16} color="var(--sky-accent)" />
                Recent Fee Receipts
              </h2>
              <Link href="/app/payments" className={styles.panelAction}>
                Fee Ledger <Icon name="chevron-right" width={12} height={12} />
              </Link>
            </div>
            <div className={styles.panelBody}>
              {data.recentAudit && data.recentAudit.length > 0 ? (
                <Timeline events={data.recentAudit} />
              ) : (
                <div className={styles.emptyState}>No payment receipts recorded yet.</div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Icon name="reports" width={16} height={16} color="var(--sky-accent)" />
                Collection vs Balance
              </h2>
            </div>
            <div className={styles.panelBody}>
              {data.feeDonut && (
                <DonutChart
                  segments={data.feeDonut}
                  centerSub="Collections"
                  size={140}
                  strokeWidth={14}
                />
              )}
            </div>
          </div>
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
          description="Academic progress, attendance rate, and fee balances for your children."
        />

        {renderDateBar()}

        <div className={styles.childGrid}>
          {data.children && data.children.length > 0 ? (
            data.children.map((child: any) => (
              <div key={child.id || child.student_id} className={styles.childCard}>
                <div className={styles.childHeader}>
                  <div>
                    <h3 className={styles.childName}>{child.full_name}</h3>
                    <span className={styles.childMeta}>
                      Adm: {child.admission_no} &bull; {child.class_name} ({child.section_name})
                    </span>
                  </div>
                  <Link href={`/app/students/${child.student_id || child.id}`}>
                    <Button variant="secondary" size="sm">
                      Profile <Icon name="chevron-right" width={12} height={12} />
                    </Button>
                  </Link>
                </div>

                <div className={styles.childStats}>
                  <Stat
                    label="Attendance"
                    value={child.attendance_percent !== null ? `${child.attendance_percent}%` : '—'}
                    subtext="School attendance this month"
                  />
                  <Stat
                    label="Outstanding Dues"
                    value={formatNpr(child.balance_due ?? child.fees_due ?? 0)}
                    subtext={(child.balance_due ?? child.fees_due ?? 0) > 0 ? 'Fee balance' : 'All clear'}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>No children currently linked to your parent portal account.</div>
          )}
        </div>

        {/* Notices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Icon name="notices" width={16} height={16} color="var(--sky-accent)" />
              School Notices &amp; Announcements
            </h2>
          </div>
          <div className={styles.panelBody}>
            <ul className={styles.itemList}>
              {data.latest_notices && data.latest_notices.length > 0 ? (
                data.latest_notices.map((n) => (
                  <li key={n.id} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemMeta}>{n.created_at?.slice(0, 10)}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li className={styles.emptyState}>No notices currently published.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ================= STUDENT VIEW =================
  if (role === 'student') {
    const student = (data as any).student;
    return (
      <div className={styles.container}>
        <PageHeader
          title={`Welcome, ${student?.full_name || 'Student'}`}
          description={`Class: ${student?.class_name || '—'} (${student?.section_name || '—'}) • Admission No: ${student?.admission_no || '—'}`}
        />

        {renderDateBar()}

        <div className={styles.statGrid}>
          <Stat
            label="My Attendance"
            value={(data as any).attendance_percent !== null ? `${(data as any).attendance_percent}%` : '—'}
            subtext="Attendance recorded this month"
          />
          <Stat
            label="Fee Dues"
            value={formatNpr((data as any).fees_due || 0)}
            subtext="Current outstanding balance"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Icon name="calendar" width={16} height={16} color="var(--sky-accent)" />
              Today&apos;s Class Timetable
            </h2>
          </div>
          <div className={styles.panelBody}>
            {(data as any).timetable_today && (data as any).timetable_today.length > 0 ? (
              <div className={styles.timetableGrid}>
                {(data as any).timetable_today.map((slot: any, idx: number) => (
                  <div key={idx} className={styles.timetableCard}>
                    <span className={styles.periodBadge}>Period {slot.period}</span>
                    <span className={styles.subjectName}>{slot.subject_name}</span>
                    <span className={styles.timeText}>{slot.teacher_name || 'Teacher'}</span>
                    {slot.start_time && (
                      <span className={styles.timeText}>
                        {slot.start_time} - {slot.end_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No classes scheduled for today.</div>
            )}
          </div>
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
