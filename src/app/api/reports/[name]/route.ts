import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, HttpError } from '@/server/http';
import {
  computeStudentResults,
  GradeScaleRow,
  SubjectRule,
  StudentMarkEntry,
} from '@/server/services/results';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function sendCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]): Response {
  const lines = [
    header.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
  ];
  const bom = '\uFEFF';
  const content = bom + lines.join('\r\n');

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const GET = handle(async (req: Request, ctx: { params: Promise<{ name: string }> }) => {
  const user = await requireUser();
  const { name } = await ctx.params;
  const url = new URL(req.url);

  // 1. STUDENTS DIRECTORY
  if (name === 'students') {
    if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'accountant' && user.role !== 'teacher') {
      throw new HttpError(403, 'Permission denied.');
    }

    const students = await query<{
      admission_no: string;
      full_name: string;
      gender: string | null;
      dob: string | null;
      blood_group: string | null;
      class_name: string | null;
      section_name: string | null;
      roll_no: number | null;
      house_name: string | null;
      status: string;
      guardian_name: string | null;
      guardian_phone: string | null;
      admitted_on: string | null;
    }>(`
      SELECT s.admission_no, s.full_name, s.gender, s.dob, s.blood_group,
             c.name as class_name, sec.name as section_name, e.roll_no,
             h.name as house_name, s.status,
             sg.name as guardian_name, sg.phone as guardian_phone,
             s.admitted_on
      FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      LEFT JOIN houses h ON s.house_id = h.id
      LEFT JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary = 1
      ORDER BY c.sort_order ASC, sec.name ASC, e.roll_no ASC, s.full_name ASC
    `);

    const header = [
      'Admission No', 'Student Name', 'Gender', 'DOB', 'Blood Group',
      'Class', 'Section', 'Roll No', 'House', 'Status',
      'Primary Guardian', 'Guardian Phone', 'Admitted On'
    ];

    const rows = students.map((s) => [
      s.admission_no, s.full_name, s.gender, s.dob, s.blood_group,
      s.class_name, s.section_name, s.roll_no, s.house_name, s.status,
      s.guardian_name, s.guardian_phone, s.admitted_on,
    ]);

    return sendCsv(`students-directory-${new Date().toISOString().split('T')[0]}.csv`, header, rows);
  }

  // 2. MONTHLY ATTENDANCE
  if (name === 'attendance-month' || name === 'attendance') {
    const sectionId = url.searchParams.get('section_id');
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    if (!sectionId) throw new HttpError(400, 'section_id query parameter is required.');

    const section = await one<{ id: number; name: string; class_name: string }>(
      `SELECT sec.id, sec.name, c.name as class_name
       FROM sections sec JOIN classes c ON sec.class_id = c.id
       WHERE sec.id = ?`,
      [parseInt(sectionId, 10)]
    );
    if (!section) throw new HttpError(404, 'Section not found.');

    const students = await query<{
      enrollment_id: number;
      roll_no: number | null;
      full_name: string;
      admission_no: string;
    }>(
      `SELECT e.id as enrollment_id, e.roll_no, s.full_name, s.admission_no
       FROM enrollments e JOIN students s ON e.student_id = s.id
       WHERE e.section_id = ? AND s.status = 'active'
       ORDER BY e.roll_no ASC, s.full_name ASC`,
      [parseInt(sectionId, 10)]
    );

    const rows: (string | number)[][] = [];
    for (const st of students) {
      const stats = await query<{ status: string; count: number }>(
        `SELECT a.status, count(*) as count
         FROM attendance a
         WHERE a.enrollment_id = ? AND a.date LIKE ?
         GROUP BY a.status`,
        [st.enrollment_id, `${month}%`]
      );

      let present = 0, absent = 0, late = 0, leave = 0;
      for (const row of stats) {
        if (row.status === 'present') present = row.count;
        else if (row.status === 'absent') absent = row.count;
        else if (row.status === 'late') late = row.count;
        else if (row.status === 'leave') leave = row.count;
      }
      const totalDays = present + absent + late + leave;
      const rate = totalDays > 0 ? `${Math.round((present / totalDays) * 100)}%` : '0%';

      rows.push([st.roll_no ?? '—', st.admission_no, st.full_name, present, absent, late, leave, totalDays, rate]);
    }

    const header = ['Roll No', 'Admission No', 'Student Name', 'Present', 'Absent', 'Late', 'Leave', 'Total Days', 'Attendance Rate'];
    return sendCsv(`attendance-${section.class_name}-${section.name}-${month}.csv`, header, rows);
  }

  // 3. EXAM RESULTS
  if (name === 'results') {
    const examId = url.searchParams.get('exam_id');
    const sectionId = url.searchParams.get('section_id');

    if (!examId || !sectionId) {
      throw new HttpError(400, 'exam_id and section_id are required.');
    }

    const exId = parseInt(examId, 10);
    const secId = parseInt(sectionId, 10);

    const exam = await one<{ name: string }>('SELECT name FROM exams WHERE id = ?', [exId]);
    const sec = await one<{ name: string; class_id: number; class_name: string }>(
      'SELECT sec.name, sec.class_id, c.name as class_name FROM sections sec JOIN classes c ON sec.class_id = c.id WHERE sec.id = ?',
      [secId]
    );

    if (!sec) throw new HttpError(404, 'Section not found.');

    const subjects = await query<SubjectRule>(
      `SELECT s.id, s.name, s.name as code, cs.full_marks, cs.pass_marks
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.class_id = ?
       ORDER BY s.id ASC`,
      [sec.class_id]
    );

    const gradeScale = await query<GradeScaleRow>(
      'SELECT min_percent, grade, gpa FROM grade_scale ORDER BY min_percent DESC'
    );

    const students = await query<{
      enrollment_id: number;
      student_id: number;
      admission_no: string;
      student_name: string;
      roll_no: number | null;
    }>(
      `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name as student_name, e.roll_no
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE e.section_id = ? AND ay.is_current = 1 AND s.status = 'active'
       ORDER BY e.roll_no ASC, s.full_name ASC`,
      [secId]
    );

    const markRows = await query<{
      enrollment_id: number;
      subject_id: number;
      marks: number | null;
    }>(
      `SELECT m.enrollment_id, m.subject_id, m.marks
       FROM marks m
       JOIN enrollments e ON m.enrollment_id = e.id
       WHERE m.exam_id = ? AND e.section_id = ?`,
      [exId, secId]
    );

    const studentMarksMap = new Map<number, StudentMarkEntry[]>();
    for (const m of markRows) {
      if (!studentMarksMap.has(m.enrollment_id)) {
        studentMarksMap.set(m.enrollment_id, []);
      }
      studentMarksMap.get(m.enrollment_id)!.push({
        subject_id: m.subject_id,
        marks: m.marks,
      });
    }

    const rawStudents = students.map((s) => ({
      ...s,
      marks: studentMarksMap.get(s.enrollment_id) || [],
    }));

    const computed = computeStudentResults(rawStudents, subjects, gradeScale);

    const header = ['Rank', 'Roll No', 'Admission No', 'Student Name', 'Total Marks', 'Percentage', 'Grade', 'GPA', 'Result'];
    const rows = computed.map((r) => {
      const letterGrade = gradeScale.find((b) => r.percentage >= b.min_percent)?.grade || 'NG';
      return [
        r.rank,
        r.roll_no ?? '—',
        r.admission_no,
        r.student_name,
        r.total_obtained,
        `${r.percentage.toFixed(2)}%`,
        letterGrade,
        r.gpa.toFixed(2),
        r.result,
      ];
    });

    const filename = `results-${exam?.name || 'exam'}-${sec?.class_name || 'class'}-${sec?.name || 'sec'}.csv`;
    return sendCsv(filename, header, rows);
  }

  // 4. FEE DUES
  if (name === 'dues') {
    if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'accountant') {
      throw new HttpError(403, 'Permission denied.');
    }

    const dues = await query<{
      admission_no: string;
      full_name: string;
      class_name: string | null;
      section_name: string | null;
      invoiced: number;
      paid: number;
      balance: number;
      phone: string | null;
    }>(`
      SELECT s.admission_no, s.full_name, c.name as class_name, sec.name as section_name,
             COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.student_id = s.id), 0) as invoiced,
             COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.student_id = s.id), 0) as paid,
             (COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.student_id = s.id), 0) -
              COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.student_id = s.id), 0)) as balance,
             (SELECT phone FROM student_guardians sg WHERE sg.student_id = s.id AND sg.is_primary = 1 LIMIT 1) as phone
      FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      WHERE s.status = 'active'
      ORDER BY balance DESC, c.sort_order ASC, s.full_name ASC
    `);

    const header = ['Admission No', 'Student Name', 'Class', 'Section', 'Total Invoiced (NPR)', 'Total Paid (NPR)', 'Balance Due (NPR)', 'Guardian Phone'];
    const rows = dues.map((d) => [
      d.admission_no, d.full_name, d.class_name, d.section_name, d.invoiced, d.paid, d.balance, d.phone,
    ]);

    return sendCsv(`fee-dues-report-${new Date().toISOString().split('T')[0]}.csv`, header, rows);
  }

  // 5. PAYMENTS IN DATE RANGE
  if (name === 'payments') {
    if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'accountant') {
      throw new HttpError(403, 'Permission denied.');
    }

    const fromDate = url.searchParams.get('from') || '1970-01-01';
    const toDate = url.searchParams.get('to') || '2099-12-31';

    const payments = await query<{
      receipt_no: string;
      paid_on: string;
      amount: number;
      method: string;
      reference: string | null;
      full_name: string;
      admission_no: string;
      invoice_no: string;
      received_by_name: string | null;
    }>(`
      SELECT p.receipt_no, p.paid_on, p.amount, p.method, p.reference,
             s.full_name, s.admission_no, i.invoice_no,
             u.name as received_by_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN students s ON i.student_id = s.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.paid_on BETWEEN ? AND ?
      ORDER BY p.id DESC
    `, [fromDate, toDate]);

    const header = ['Receipt No', 'Date', 'Amount (NPR)', 'Method', 'Reference / Cheque', 'Student Name', 'Admission No', 'Invoice No', 'Cashier'];
    const rows = payments.map((p) => [
      p.receipt_no, p.paid_on, p.amount, p.method, p.reference, p.full_name, p.admission_no, p.invoice_no, p.received_by_name,
    ]);

    return sendCsv(`payments-report-${fromDate}-to-${toDate}.csv`, header, rows);
  }

  // 6. LIBRARY OVERDUE
  if (name === 'library-overdue') {
    if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
      throw new HttpError(403, 'Permission denied.');
    }

    const overdue = await query<{
      accession_no: string;
      title: string;
      borrower_name: string;
      borrower_type: string;
      borrower_contact: string | null;
      issued_on: string;
      due_on: string;
      days_overdue: number;
    }>(`
      SELECT b.accession_no, b.title,
             COALESCE(s.full_name, u.name) as borrower_name,
             CASE WHEN bl.student_id IS NOT NULL THEN 'Student' ELSE 'Staff' END as borrower_type,
             COALESCE(s.admission_no, u.phone) as borrower_contact,
             bl.issued_on, bl.due_on,
             CAST((julianday(date('now')) - julianday(bl.due_on)) AS INTEGER) as days_overdue
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN students s ON bl.student_id = s.id
      LEFT JOIN users u ON bl.staff_id = u.id
      WHERE bl.returned_on IS NULL AND bl.due_on < date('now')
      ORDER BY bl.due_on ASC
    `);

    const header = ['Accession No', 'Book Title', 'Borrower Name', 'Type', 'Contact / ID', 'Issued On', 'Due Date', 'Days Overdue'];
    const rows = overdue.map((o) => [
      o.accession_no, o.title, o.borrower_name, o.borrower_type, o.borrower_contact, o.issued_on, o.due_on, Math.max(0, o.days_overdue),
    ]);

    return sendCsv(`library-overdue-${new Date().toISOString().split('T')[0]}.csv`, header, rows);
  }

  throw new HttpError(404, `Unknown report "${name}".`);
});
