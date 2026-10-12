import { requireUser } from '@/server/guard';
import { one, query } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const params = await context?.params;
  const paymentId = parseInt(params?.id || '', 10);
  if (isNaN(paymentId)) throw new HttpError(400, 'Invalid payment ID.');

  const payment = await one<{
    id: number;
    receipt_no: string;
    invoice_id: number;
    amount: number;
    method: string;
    reference: string | null;
    paid_on: string;
    received_by_name: string | null;
    invoice_no: string;
    invoice_title: string;
    invoice_total: number;
    student_id: number;
    student_name: string;
    admission_no: string;
    class_name: string | null;
    section_name: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
  }>(
    `SELECT p.*, u.name as received_by_name,
            i.invoice_no, i.title as invoice_title, i.total as invoice_total,
            s.id as student_id, s.full_name as student_name, s.admission_no,
            c.name as class_name, sec.name as section_name,
            g.name as guardian_name, g.phone as guardian_phone
     FROM payments p
     JOIN invoices i ON p.invoice_id = i.id
     JOIN students s ON i.student_id = s.id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = i.academic_year_id
     LEFT JOIN sections sec ON e.section_id = sec.id
     LEFT JOIN classes c ON sec.class_id = c.id
     LEFT JOIN student_guardians g ON g.student_id = s.id AND g.is_primary = 1
     LEFT JOIN users u ON p.received_by = u.id
     WHERE p.id = ?`,
    [paymentId]
  );

  if (!payment) throw new HttpError(404, 'Payment receipt not found.');

  if (user.role === 'parent') {
    const isParent = await one(
      'SELECT 1 FROM student_guardians WHERE user_id = ? AND student_id = ?',
      [user.id, payment.student_id]
    );
    if (!isParent) {
      throw new HttpError(403, 'Forbidden: You can only view receipts for your registered children.');
    }
  } else if (user.role === 'student') {
    const isStudent = await one(
      'SELECT 1 FROM students WHERE user_id = ? AND id = ?',
      [user.id, payment.student_id]
    );
    if (!isStudent) {
      throw new HttpError(403, 'Forbidden: You can only view your own receipts.');
    }
  } else if (user.role === 'teacher') {
    throw new HttpError(403, 'Forbidden: Teachers do not have access to fee receipts.');
  }

  // Items from invoice
  const items = await query<{ description: string; amount: number }>(
    'SELECT description, amount FROM invoice_items WHERE invoice_id = ?',
    [payment.invoice_id]
  );

  // All payments towards this invoice up to this receipt
  const allPayments = await query<{ id: number; amount: number; paid_on: string; receipt_no: string }>(
    'SELECT id, amount, paid_on, receipt_no FROM payments WHERE invoice_id = ? ORDER BY id ASC',
    [payment.invoice_id]
  );

  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
  const remainingBalance = Math.max(0, payment.invoice_total - totalPaid);

  return json({
    payment,
    items,
    allPayments,
    totalPaid,
    remainingBalance,
  });
});
