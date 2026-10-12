import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const classId = url.searchParams.get('class_id');
  const statusFilter = url.searchParams.get('status');
  const q = url.searchParams.get('q');
  const studentIdParam = url.searchParams.get('student_id');

  const today = new Date().toISOString().slice(0, 10);

  let sql = `
    SELECT i.id, i.invoice_no, i.student_id, i.title, i.due_date, i.total, i.created_at,
           s.full_name as student_name, s.admission_no,
           c.name as class_name, sec.name as section_name,
           COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount,
           (SELECT p.id FROM payments p WHERE p.invoice_id = i.id ORDER BY p.id DESC LIMIT 1) as latest_payment_id
    FROM invoices i
    JOIN students s ON i.student_id = s.id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = i.academic_year_id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (user.role === 'parent') {
    sql += ` AND i.student_id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)`;
    args.push(user.id);
  } else if (user.role === 'student') {
    sql += ` AND s.user_id = ?`;
    args.push(user.id);
  }

  if (studentIdParam) {
    sql += ' AND i.student_id = ?';
    args.push(studentIdParam);
  }

  if (classId) {
    sql += ' AND c.id = ?';
    args.push(classId);
  }

  if (q) {
    sql += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR i.invoice_no LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term);
  }

  sql += ' ORDER BY i.id DESC';

  const rows = await query<{
    id: number;
    invoice_no: string;
    student_id: number;
    title: string;
    due_date: string | null;
    total: number;
    paid_amount: number;
    latest_payment_id: number | null;
    student_name: string;
    admission_no: string;
    class_name: string | null;
    section_name: string | null;
    created_at: string;
  }>(sql, args);

  // Compute status & filter if requested
  const itemsWithStatus = rows.map((r) => {
    const paid = r.paid_amount;
    const balance = Math.max(0, r.total - paid);
    let status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' = 'Unpaid';

    if (paid >= r.total) {
      status = 'Paid';
    } else if (paid > 0) {
      status = 'Partial';
    } else if (r.due_date && r.due_date < today) {
      status = 'Overdue';
    }

    return {
      ...r,
      balance,
      status,
    };
  });

  const filtered = statusFilter
    ? itemsWithStatus.filter((item) => item.status.toLowerCase() === statusFilter.toLowerCase())
    : itemsWithStatus;

  // Aggregate totals
  const totalBilled = filtered.reduce((s, i) => s + i.total, 0);
  const totalPaid = filtered.reduce((s, i) => s + i.paid_amount, 0);
  const totalBalance = filtered.reduce((s, i) => s + i.balance, 0);

  return json({
    items: filtered,
    totalBilled,
    totalPaid,
    totalBalance,
  });
});
