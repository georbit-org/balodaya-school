import { query, one } from '@/server/db';
import { SessionUser } from '@/server/session';
import { getRecentAudit } from '@/server/audit';
import { todayNPT, dayOfWeek, addDays, isWorkingDay, toBS } from '@/lib/calendar';
import { getCalendarContext } from '@/server/services/calendar';
import { getSetting } from '@/server/settings';

export interface DashboardResponse {
  role: SessionUser['role'];
  user: {
    id: number;
    name: string;
    email: string;
  };
  school_identity?: {
    name: string;
    address: string;
  };
  today_date_display?: {
    bsEn: string;
    bsNe: string;
    adStr: string;
  };
  stats?: Record<string, number | string>;
  needsAttention?: Array<{
    id: string;
    label: string;
    count: number;
    href: string;
    badgeVariant: 'warning' | 'danger' | 'info';
  }>;
  attendanceChart?: Array<{ label: string; value: number }>;
  feeDonut?: Array<{ label: string; value: number; color: string }>;
  houseStandings?: Array<{ name: string; points: number; color: string }>;
  recentAudit?: Array<{
    id: number;
    title: string;
    timestamp: string;
    description: string;
    meta?: string;
  }>;
  upcoming_exams?: Array<{ id: number; name: string; start_date: string; end_date: string }>;
  latest_notices?: Array<{ id: number; title: string; kind?: string; created_at?: string; published_on?: string }>;
  sections_attendance_pending?: Array<{
    id: number;
    class_name: string;
    section_name: string;
    teacher_name: string | null;
  }>;
  staff_on_leave_today_list?: Array<{
    name: string;
    role: string;
    reason: string;
    leave_type: string | null;
  }>;
  fee_collected_today?: number;
  upcoming_holidays?: Array<{
    id: number;
    date: string;
    title: string;
    title_ne: string | null;
    kind: string;
  }>;
  // Role specific extra properties
  my_sections?: Array<{ section_id: number; class_name: string; section_name: string; marked_today: number }>;
  timetable_today?: Array<{
    period: number;
    start_time: string;
    end_time: string;
    class_name?: string;
    section_name?: string;
    subject_name: string;
    teacher_name?: string | null;
  }>;
  leave_requests?: Array<{ id: number; student_name: string; class_name: string; reason: string; from_date: string; to_date: string }>;
  attendance_month?: { present: number; absent: number; late: number; percent: number };
  children?: Array<{
    id?: number;
    student_id: number;
    full_name: string;
    admission_no: string;
    class_name: string;
    section_name: string;
    balance_due: number;
    fees_due?: number;
    attendance_percent: number | null;
  }>;
  selected_child?: {
    student_id: number;
    full_name: string;
    admission_no: string;
    class_name: string;
    section_name: string;
    balance_due: number;
    attendance_percent: number;
    recent_marks: Array<{ exam_name: string; subject_name: string; marks: number; full_marks: number }>;
    timetable: Array<{ period: number; start_time: string; end_time: string; subject_name: string }>;
  };
  my_timetable?: Array<{ period: number; start_time: string; end_time: string; subject_name: string }>;
  my_house?: { name: string; points: number };
  pending_leaves_count?: number;
  recent_payments?: Array<{
    id: number;
    receipt_no: string;
    student_name: string;
    admission_no: string;
    amount: number;
    method: string;
    paid_on: string;
  }>;
  student?: Record<string, unknown> | null;
  attendance_percent?: number | null;
  fees_due?: number;
}

export async function getDashboardData(user: SessionUser): Promise<DashboardResponse> {
  const today = todayNPT();
  const currentDayOfWeek = dayOfWeek(today);

  // 1. ADMIN & PRINCIPAL
  if (user.role === 'admin' || user.role === 'principal') {
    const [
      newApps,
      totalStudents,
      absentToday,
      totalSections,
      markedSections,
      unpaidInvoices,
      latestNotices,
      upcomingExams,
      pendingLeave,
      pendingStaffLeave,
      staffPresentToday,
      staffOnLeaveToday,
      unreadMessages,
      overdueLoans,
      houses,
      recentAudit,
      feeCollectedToday,
      pendingSections,
      staffOnLeaveList,
      upcomingHolidays,
      schoolName,
      schoolAddress,
    ] = await Promise.all([
      one<{ count: number }>("SELECT COUNT(*) as count FROM applications WHERE status = 'new'"),
      one<{ count: number }>("SELECT COUNT(*) as count FROM students WHERE status = 'active'"),
      one<{ count: number }>("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'absent'", [today]),
      one<{ count: number }>('SELECT COUNT(*) as count FROM sections'),
      one<{ count: number }>(
        `SELECT COUNT(DISTINCT e.section_id) as count
         FROM attendance a
         JOIN enrollments e ON a.enrollment_id = e.id
         WHERE a.date = ?`,
        [today]
      ),
      query<{ total: number; paid: number }>(
        `SELECT i.total,
                COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid
         FROM invoices i`
      ),
      query<{ id: number; title: string; kind: string; created_at: string }>(
        'SELECT id, title, kind, created_at FROM notices ORDER BY id DESC LIMIT 5'
      ),
      query<{ id: number; name: string; start_date: string; end_date: string }>(
        'SELECT id, name, start_date, end_date FROM exams ORDER BY id DESC LIMIT 3'
      ),
      one<{ count: number }>("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'"),
      one<{ count: number }>("SELECT COUNT(*) as count FROM staff_leave_requests WHERE status = 'pending'"),
      one<{ count: number }>("SELECT COUNT(*) as count FROM staff_attendance WHERE date = ? AND status = 'present'", [today]),
      one<{ count: number }>("SELECT COUNT(*) as count FROM staff_leave_requests WHERE status = 'approved' AND ? BETWEEN from_date AND to_date", [today]),
      one<{ count: number }>("SELECT COUNT(*) as count FROM messages WHERE status = 'new'"),
      one<{ count: number }>("SELECT COUNT(*) as count FROM book_loans WHERE returned_on IS NULL AND due_on < ?", [today]),
      query<{ name: string; points: number }>(
        `SELECT h.name, COALESCE(SUM(hp.points), 0) as points
         FROM houses h
         LEFT JOIN house_points hp ON h.id = hp.house_id
         GROUP BY h.id, h.name
         ORDER BY points DESC`
      ),
      getRecentAudit(6),
      one<{ total: number }>(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE paid_on = ?',
        [today]
      ),
      query<{ id: number; class_name: string; section_name: string; teacher_name: string | null }>(
        `SELECT sec.id, c.name as class_name, sec.name as section_name, u.name as teacher_name
         FROM sections sec
         JOIN classes c ON sec.class_id = c.id
         LEFT JOIN users u ON sec.class_teacher_id = u.id
         WHERE sec.id NOT IN (
           SELECT DISTINCT e.section_id
           FROM attendance a
           JOIN enrollments e ON a.enrollment_id = e.id
           WHERE a.date = ?
         )
         ORDER BY c.sort_order, sec.name`,
        [today]
      ),
      query<{ name: string; role: string; reason: string; leave_type: string | null }>(
        `SELECT u.name, u.role, slr.reason, lt.name as leave_type
         FROM staff_leave_requests slr
         JOIN users u ON slr.user_id = u.id
         LEFT JOIN leave_types lt ON slr.leave_type_id = lt.id
         WHERE slr.status = 'approved' AND ? BETWEEN slr.from_date AND slr.to_date`,
        [today]
      ),
      query<{ id: number; date: string; title: string; title_ne: string | null; kind: string }>(
        `SELECT id, date, title, title_ne, kind
         FROM school_calendar
         WHERE date >= ? AND date <= ?
         ORDER BY date ASC`,
        [today, addDays(today, 14)]
      ),
      getSetting('school_name'),
      getSetting('school_address'),
    ]);

    let outstandingDues = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    for (const inv of unpaidInvoices) {
      const bal = inv.total - inv.paid;
      if (bal > 0) outstandingDues += bal;

      if (inv.paid >= inv.total) paidCount++;
      else if (inv.paid > 0) partialCount++;
      else unpaidCount++;
    }

    const unmarkedCount = Math.max(0, (totalSections?.count ?? 0) - (markedSections?.count ?? 0));

    // Needs attention checklist
    const needsAttention: DashboardResponse['needsAttention'] = [];
    if (unmarkedCount > 0) {
      needsAttention.push({
        id: 'unmarked-attendance',
        label: `${unmarkedCount} section(s) have not submitted daily attendance today`,
        count: unmarkedCount,
        href: '/app/attendance',
        badgeVariant: 'warning',
      });
    }
    if ((newApps?.count ?? 0) > 0) {
      needsAttention.push({
        id: 'new-admissions',
        label: `${newApps?.count} online admission application(s) awaiting verification`,
        count: newApps?.count ?? 0,
        href: '/app/applications',
        badgeVariant: 'info',
      });
    }
    if ((pendingLeave?.count ?? 0) > 0) {
      needsAttention.push({
        id: 'pending-leave',
        label: `${pendingLeave?.count} student leave request(s) pending principal review`,
        count: pendingLeave?.count ?? 0,
        href: '/app/leave',
        badgeVariant: 'warning',
      });
    }
    if ((pendingStaffLeave?.count ?? 0) > 0) {
      needsAttention.push({
        id: 'pending-staff-leave',
        label: `${pendingStaffLeave?.count} faculty/staff leave request(s) awaiting approval`,
        count: pendingStaffLeave?.count ?? 0,
        href: '/app/leave',
        badgeVariant: 'warning',
      });
    }
    if ((overdueLoans?.count ?? 0) > 0) {
      needsAttention.push({
        id: 'overdue-library',
        label: `${overdueLoans?.count} library book loan(s) are overdue for return`,
        count: overdueLoans?.count ?? 0,
        href: '/app/library',
        badgeVariant: 'danger',
      });
    }
    if ((unreadMessages?.count ?? 0) > 0) {
      needsAttention.push({
        id: 'unread-messages',
        label: `${unreadMessages?.count} new inquiry / contact message(s) received`,
        count: unreadMessages?.count ?? 0,
        href: '/app/messages',
        badgeVariant: 'info',
      });
    }

    // Real student attendance calculated across the last 6 working school days
    const calCtx = await getCalendarContext();
    const workingDays: string[] = [];
    let checkDate = today;
    let safetyCounter = 0;

    while (workingDays.length < 6 && safetyCounter < 45) {
      if (isWorkingDay(checkDate, calCtx)) {
        workingDays.push(checkDate);
      }
      checkDate = addDays(checkDate, -1);
      safetyCounter++;
    }

    workingDays.reverse();

    const attendanceChart: Array<{ label: string; value: number }> = [];
    for (const d of workingDays) {
      const attRow = await one<{ total: number; present: number }>(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present
         FROM attendance
         WHERE date = ?`,
        [d]
      );

      const bs = toBS(d);
      const label = `${bs.monthName.slice(0, 3)} ${bs.day}`;
      const pct = attRow && attRow.total > 0
        ? Math.round((attRow.present / attRow.total) * 100)
        : 0;

      attendanceChart.push({ label, value: pct });
    }

    // House colors
    const houseColorMap: Record<string, string> = {
      Red: 'var(--house-red)',
      Yellow: 'var(--house-yellow)',
      Blue: 'var(--house-blue)',
      Green: 'var(--house-green)',
      Orange: 'var(--house-orange)',
    };

    const houseStandings = houses.map((h) => ({
      name: h.name,
      points: h.points,
      color: houseColorMap[h.name] || 'var(--sky-accent)',
    }));

    const feeDonut = [
      { label: 'Collected', value: Math.max(1, paidCount), color: 'var(--sky-accent)' },
      { label: 'Partial', value: Math.max(0, partialCount), color: '#F59E0B' },
      { label: 'Overdue / Unpaid', value: Math.max(0, unpaidCount), color: 'var(--danger)' },
    ];

    const auditEvents = recentAudit.map((a) => ({
      id: a.id,
      title: a.action,
      timestamp: a.created_at,
      description: a.detail || `${a.entity || 'Record'} updated`,
      meta: a.user_name ? `By ${a.user_name}` : undefined,
    }));

    const todayBS = toBS(today);
    const todayDateDisplay = {
      bsEn: todayBS.formatted,
      bsNe: `${todayBS.day} ${todayBS.monthNameNe} ${todayBS.year}`,
      adStr: today,
    };

    return {
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email },
      school_identity: {
        name: schoolName || 'Balodaya Secondary School',
        address: schoolAddress || 'Bheerkot-06, Syangja',
      },
      today_date_display: todayDateDisplay,
      stats: {
        new_applications: newApps?.count ?? 0,
        total_students: totalStudents?.count ?? 0,
        absent_today: absentToday?.count ?? 0,
        unmarked_sections_today: unmarkedCount,
        outstanding_dues: outstandingDues,
        staff_present_today: staffPresentToday?.count ?? 0,
        staff_on_leave_today: staffOnLeaveToday?.count ?? 0,
        pending_staff_leaves: pendingStaffLeave?.count ?? 0,
        fee_collected_today: feeCollectedToday?.total ?? 0,
      },
      needsAttention,
      attendanceChart,
      feeDonut,
      houseStandings,
      recentAudit: auditEvents,
      upcoming_exams: upcomingExams,
      latest_notices: latestNotices,
      sections_attendance_pending: pendingSections,
      staff_on_leave_today_list: staffOnLeaveList,
      fee_collected_today: feeCollectedToday?.total ?? 0,
      upcoming_holidays: upcomingHolidays,
    };
  }

  // Fallback / standard role queries (Teacher, Accountant, Parent, Student)
  // Re-use logic from api/dashboard
  const [latestNotices, upcomingExams] = await Promise.all([
    query<{ id: number; title: string; kind: string; created_at: string }>(
      'SELECT id, title, kind, created_at FROM notices ORDER BY id DESC LIMIT 5'
    ),
    query<{ id: number; name: string; start_date: string; end_date: string }>(
      'SELECT id, name, start_date, end_date FROM exams ORDER BY id DESC LIMIT 3'
    ),
  ]);

  if (user.role === 'teacher') {
    const mySections = await query<{
      section_id: number;
      class_name: string;
      section_name: string;
      marked_today: number;
    }>(
      `SELECT sec.id as section_id, c.name as class_name, sec.name as section_name,
              (SELECT COUNT(*) FROM attendance a
               JOIN enrollments e ON a.enrollment_id = e.id
               WHERE e.section_id = sec.id AND a.date = ?) as marked_today
       FROM sections sec
       JOIN classes c ON sec.class_id = c.id
       WHERE sec.class_teacher_id = ?`,
      [today, user.id]
    );

    let timetableToday: Array<{
      period: number;
      start_time: string;
      end_time: string;
      class_name: string;
      section_name: string;
      subject_name: string;
    }> = [];
    if (currentDayOfWeek <= 5) {
      timetableToday = await query(
        `SELECT tt.period, tt.start_time, tt.end_time,
                c.name as class_name, sec.name as section_name, sub.name as subject_name
         FROM timetable_slots tt
         JOIN sections sec ON tt.section_id = sec.id
         JOIN classes c ON sec.class_id = c.id
         JOIN subjects sub ON tt.subject_id = sub.id
         WHERE tt.teacher_id = ? AND tt.day_of_week = ?
         ORDER BY tt.period ASC`,
        [user.id, currentDayOfWeek]
      );
    }

    const pendingLeaves = await query<{
      id: number;
      student_name: string;
      class_name: string;
      reason: string;
      from_date: string;
      to_date: string;
    }>(
      `SELECT lr.id, s.full_name as student_name, c.name as class_name,
              lr.reason, lr.from_date, lr.to_date
       FROM leave_requests lr
       JOIN students s ON lr.student_id = s.id
       JOIN enrollments e ON s.id = e.student_id
       JOIN sections sec ON e.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       WHERE sec.class_teacher_id = ? AND lr.status = 'pending'`,
      [user.id]
    );

    return {
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email },
      my_sections: mySections,
      timetable_today: timetableToday,
      pending_leaves_count: pendingLeaves.length,
      leave_requests: pendingLeaves,
      latest_notices: latestNotices,
      upcoming_exams: upcomingExams,
    };
  }

  if (user.role === 'accountant') {
    const todayPayments = await one<{ total: number | null; count: number }>(
      `SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE paid_on = ?`,
      [today]
    );

    const monthPayments = await one<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM payments WHERE paid_on LIKE ?`,
      [`${today.slice(0, 7)}%`]
    );

    const duesTotal = await one<{ total_dues: number | null }>(
      `SELECT SUM(i.total - COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id = i.id), 0)) as total_dues
       FROM invoices i`
    );

    const recentPayments = await query<{
      id: number;
      receipt_no: string;
      student_name: string;
      admission_no: string;
      amount: number;
      method: string;
      paid_on: string;
    }>(
      `SELECT p.id, p.receipt_no, s.full_name as student_name, s.admission_no,
              p.amount, p.method, p.paid_on
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN students s ON i.student_id = s.id
       ORDER BY p.id DESC
       LIMIT 8`
    );

    return {
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email },
      stats: {
        collected_today: todayPayments?.total ?? 0,
        today_collection: todayPayments?.total ?? 0,
        today_receipts_count: todayPayments?.count ?? 0,
        collected_this_month: monthPayments?.total ?? 0,
        month_collection: monthPayments?.total ?? 0,
        outstanding_total: duesTotal?.total_dues ?? 0,
        outstanding_dues: duesTotal?.total_dues ?? 0,
        overdue_invoices_count: 0,
      },
      recent_payments: recentPayments,
      feeDonut: [
        { label: 'Today Collections', value: Math.max(1, todayPayments?.total ?? 0), color: 'var(--sky-accent)' },
        { label: 'Month Target Balance', value: Math.max(1, (duesTotal?.total_dues ?? 0)), color: '#F59E0B' },
      ],
      recentAudit: recentPayments.map((p) => ({
        id: p.id,
        title: `Receipt #${p.receipt_no}`,
        timestamp: p.paid_on,
        description: `NPR ${p.amount.toLocaleString()} from ${p.student_name} (${p.admission_no}) via ${p.method.toUpperCase()}`,
      })),
      latest_notices: latestNotices,
    };
  }

  // Parent view
  if (user.role === 'parent') {
    const currentMonth = today.slice(0, 7);
    const children = await query<{
      id: number;
      admission_no: string;
      full_name: string;
      class_name: string | null;
      section_name: string | null;
    }>(
      `SELECT s.id, s.admission_no, s.full_name, c.name as class_name, sec.name as section_name
       FROM student_guardians sg
       JOIN students s ON sg.student_id = s.id
       LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
       LEFT JOIN sections sec ON e.section_id = sec.id
       LEFT JOIN classes c ON sec.class_id = c.id
       WHERE sg.user_id = ?`,
      [user.id]
    );

    const childrenData = [];
    for (const ch of children) {
      const attStats = await query<{ status: string; count: number }>(
        `SELECT a.status, count(*) as count
         FROM attendance a
         JOIN enrollments e ON a.enrollment_id = e.id
         WHERE e.student_id = ? AND a.date LIKE ?
         GROUP BY a.status`,
        [ch.id, `${currentMonth}%`]
      );
      let present = 0;
      let totalAtt = 0;
      for (const st of attStats) {
        if (st.status === 'present') present += st.count;
        totalAtt += st.count;
      }
      const attPercent = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : null;

      const invs = await query<{ total: number; paid: number }>(
        `SELECT i.total, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid
         FROM invoices i WHERE i.student_id = ?`,
        [ch.id]
      );
      let dues = 0;
      for (const inv of invs) {
        const bal = inv.total - inv.paid;
        if (bal > 0) dues += bal;
      }

      childrenData.push({
        id: ch.id,
        student_id: ch.id,
        admission_no: ch.admission_no,
        full_name: ch.full_name,
        class_name: ch.class_name || '—',
        section_name: ch.section_name || '—',
        attendance_percent: attPercent,
        balance_due: dues,
        fees_due: dues,
      });
    }

    return {
      role: 'parent',
      user: { id: user.id, name: user.name, email: user.email },
      children: childrenData,
      latest_notices: latestNotices,
      upcoming_exams: upcomingExams,
    };
  }

  // Student view
  if (user.role === 'student') {
    const currentMonth = today.slice(0, 7);
    const student = await one<{
      id: number;
      admission_no: string;
      full_name: string;
      class_name: string | null;
      section_name: string | null;
      enrollment_id: number | null;
    }>(
      `SELECT s.id, s.admission_no, s.full_name, c.name as class_name, sec.name as section_name, e.id as enrollment_id
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
       LEFT JOIN sections sec ON e.section_id = sec.id
       LEFT JOIN classes c ON sec.class_id = c.id
       WHERE s.user_id = ?`,
      [user.id]
    );

    let attPercent: number | null = null;
    let feesDue = 0;
    let timetableToday: Array<{
      period: number;
      start_time: string;
      end_time: string;
      subject_name: string;
      teacher_name: string | null;
    }> = [];

    if (student) {
      const attStats = await query<{ status: string; count: number }>(
        `SELECT a.status, count(*) as count
         FROM attendance a
         JOIN enrollments e ON a.enrollment_id = e.id
         WHERE e.student_id = ? AND a.date LIKE ?
         GROUP BY a.status`,
        [student.id, `${currentMonth}%`]
      );
      let present = 0;
      let totalAtt = 0;
      for (const st of attStats) {
        if (st.status === 'present') present += st.count;
        totalAtt += st.count;
      }
      if (totalAtt > 0) attPercent = Math.round((present / totalAtt) * 100);

      const invs = await query<{ total: number; paid: number }>(
        `SELECT i.total, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid
         FROM invoices i WHERE i.student_id = ?`,
        [student.id]
      );
      for (const inv of invs) {
        const bal = inv.total - inv.paid;
        if (bal > 0) feesDue += bal;
      }

      if (student.enrollment_id && currentDayOfWeek <= 5) {
        timetableToday = await query(
          `SELECT tt.period, tt.start_time, tt.end_time,
                  sub.name as subject_name, u.name as teacher_name
           FROM timetable_slots tt
           JOIN enrollments e ON tt.section_id = e.section_id
           JOIN subjects sub ON tt.subject_id = sub.id
           LEFT JOIN users u ON tt.teacher_id = u.id
           WHERE e.id = ? AND tt.day_of_week = ?
           ORDER BY tt.period ASC`,
          [student.enrollment_id, currentDayOfWeek]
        );
      }
    }

    return {
      role: 'student',
      user: { id: user.id, name: user.name, email: user.email },
      student,
      attendance_percent: attPercent,
      fees_due: feesDue,
      timetable_today: timetableToday,
      latest_notices: latestNotices,
      upcoming_exams: upcomingExams,
    };
  }

  // Fallback
  return {
    role: user.role,
    user: { id: user.id, name: user.name, email: user.email },
    latest_notices: latestNotices,
    upcoming_exams: upcomingExams,
  };
}
