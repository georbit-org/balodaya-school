import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json } from '@/server/http';

export const GET = handle(async () => {
  const user = await requireUser();
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0=Sun..6=Sat (Sat is holiday in Nepal)
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'

  // ================= ADMIN & PRINCIPAL =================
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
    ]);

    let outstandingDues = 0;
    let overdueCount = 0;
    for (const inv of unpaidInvoices) {
      const bal = inv.total - inv.paid;
      if (bal > 0) outstandingDues += bal;
    }

    const unmarkedCount = Math.max(0, (totalSections?.count ?? 0) - (markedSections?.count ?? 0));

    return json({
      role: user.role,
      stats: {
        new_applications: newApps?.count ?? 0,
        total_students: totalStudents?.count ?? 0,
        absent_today: absentToday?.count ?? 0,
        unmarked_sections_today: unmarkedCount,
        outstanding_dues: outstandingDues,
      },
      upcoming_exams: upcomingExams,
      latest_notices: latestNotices,
    });
  }

  // ================= TEACHER =================
  if (user.role === 'teacher') {
    // 1. My Class Teacher Sections
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

    // 2. Timetable today (if Sun-Fri: dayOfWeek between 0 and 5)
    let timetableToday: any[] = [];
    if (dayOfWeek <= 5) {
      timetableToday = await query(
        `SELECT tt.period, tt.start_time, tt.end_time,
                c.name as class_name, sec.name as section_name, sub.name as subject_name
         FROM timetable_slots tt
         JOIN sections sec ON tt.section_id = sec.id
         JOIN classes c ON sec.class_id = c.id
         JOIN subjects sub ON tt.subject_id = sub.id
         WHERE tt.teacher_id = ? AND tt.day_of_week = ?
         ORDER BY tt.period ASC`,
        [user.id, dayOfWeek]
      );
    }

    // 3. Pending leave requests
    const pendingLeaves = await one<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM leave_requests lr
       JOIN enrollments e ON lr.student_id = e.student_id
       JOIN sections sec ON e.section_id = sec.id
       WHERE sec.class_teacher_id = ? AND lr.status = 'pending'`,
      [user.id]
    );

    // 4. Notices
    const notices = await query(
      "SELECT id, title, kind, created_at FROM notices WHERE published = 1 AND audience IN ('public', 'staff') ORDER BY id DESC LIMIT 5"
    );

    return json({
      role: 'teacher',
      my_sections: mySections,
      timetable_today: timetableToday,
      pending_leaves_count: pendingLeaves?.count ?? 0,
      latest_notices: notices,
    });
  }

  // ================= ACCOUNTANT =================
  if (user.role === 'accountant') {
    const [todayPayments, monthPayments, allInvoices, recentPayments] = await Promise.all([
      one<{ sum: number }>(
        'SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE paid_on = ?',
        [today]
      ),
      one<{ sum: number }>(
        "SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE paid_on LIKE ?",
        [`${currentMonth}%`]
      ),
      query<{ total: number; paid: number; due_date: string | null }>(
        `SELECT i.total, i.due_date,
                COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid
         FROM invoices i`
      ),
      query(
        `SELECT p.id, p.receipt_no, p.amount, p.paid_on, p.method,
                s.full_name as student_name, s.admission_no
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         JOIN students s ON i.student_id = s.id
         ORDER BY p.id DESC LIMIT 5`
      ),
    ]);

    let outstanding = 0;
    let overdueCount = 0;
    for (const inv of allInvoices) {
      const bal = inv.total - inv.paid;
      if (bal > 0) {
        outstanding += bal;
        if (inv.due_date && inv.due_date < today) overdueCount++;
      }
    }

    return json({
      role: 'accountant',
      stats: {
        collected_today: todayPayments?.sum ?? 0,
        collected_this_month: monthPayments?.sum ?? 0,
        outstanding_total: outstanding,
        overdue_invoices_count: overdueCount,
      },
      recent_payments: recentPayments,
    });
  }

  // ================= PARENT =================
  if (user.role === 'parent') {
    // Find children
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
      // Attendance this month
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

      // Fees due
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
        ...ch,
        attendance_percent: attPercent,
        fees_due: dues,
      });
    }

    const notices = await query(
      "SELECT id, title, kind, created_at FROM notices WHERE published = 1 AND audience IN ('public', 'parents') ORDER BY id DESC LIMIT 5"
    );

    return json({
      role: 'parent',
      children: childrenData,
      latest_notices: notices,
    });
  }

  // ================= STUDENT =================
  if (user.role === 'student') {
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
    let timetableToday: any[] = [];

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

      if (student.enrollment_id && dayOfWeek <= 5) {
        timetableToday = await query(
          `SELECT tt.period, tt.start_time, tt.end_time,
                  sub.name as subject_name, u.name as teacher_name
           FROM timetable_slots tt
           JOIN enrollments e ON tt.section_id = e.section_id
           JOIN subjects sub ON tt.subject_id = sub.id
           LEFT JOIN users u ON tt.teacher_id = u.id
           WHERE e.id = ? AND tt.day_of_week = ?
           ORDER BY tt.period ASC`,
          [student.enrollment_id, dayOfWeek]
        );
      }
    }

    const notices = await query(
      "SELECT id, title, kind, created_at FROM notices WHERE published = 1 AND audience IN ('public', 'students') ORDER BY id DESC LIMIT 5"
    );

    return json({
      role: 'student',
      student,
      attendance_percent: attPercent,
      fees_due: feesDue,
      timetable_today: timetableToday,
      latest_notices: notices,
    });
  }

  return json({ role: user.role });
});
