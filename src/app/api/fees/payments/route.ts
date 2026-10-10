import { requireRole, requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'accountant');
  const user = await requireUser();

  const body = await req.json().catch(() => ({}));
  const { invoice_id, amount, method = 'cash', reference = null, paid_on } = body;

  if (!invoice_id || !amount || !paid_on) {
    throw new HttpError(400, 'invoice_id, amount, and paid_on date are required.');
  }

  const numAmount = parseInt(String(amount), 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new HttpError(400, 'Payment amount must be greater than zero.');
  }

  const invoice = await one<{
    id: number;
    total: number;
    academic_year_name: string;
    student_id: number;
  }>(
    `SELECT i.id, i.total, i.student_id, ay.name as academic_year_name
     FROM invoices i
     JOIN academic_years ay ON i.academic_year_id = ay.id
     WHERE i.id = ?`,
    [invoice_id]
  );
  if (!invoice) throw new HttpError(404, 'Invoice not found.');

  const paidSumRow = await one<{ total_paid: number | null }>(
    'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?',
    [invoice_id]
  );
  const currentPaid = paidSumRow?.total_paid ?? 0;
  const balance = Math.max(0, invoice.total - currentPaid);

  if (numAmount > balance) {
    throw new HttpError(
      400,
      `Payment amount (Rs. ${numAmount}) exceeds the invoice balance (Rs. ${balance}).`
    );
  }

  // Generate sequence for receipt number
  const countRow = await one<{ count: number }>(
    'SELECT count(*) as count FROM payments WHERE receipt_no LIKE ?',
    [`RCP-${invoice.academic_year_name}-%`]
  );
  const nextSeq = (countRow?.count ?? 0) + 1;
  const receiptNo = `RCP-${invoice.academic_year_name}-${String(nextSeq).padStart(5, '0')}`;

  const res = await run(
    `INSERT INTO payments (receipt_no, invoice_id, amount, method, reference, paid_on, received_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [receiptNo, invoice_id, numAmount, method, reference, paid_on, user.id]
  );
  const paymentId = Number(res.lastInsertRowid);
  const remainingBalance = balance - numAmount;

  return json({
    success: true,
    paymentId,
    receiptNo,
    remainingBalance,
  }, 201);
});

export const GET = handle(async (req: Request) => {
  await requireRole('admin', 'principal', 'accountant');
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const method = searchParams.get('method')?.trim() || '';
  const dateFrom = searchParams.get('from')?.trim() || '';
  const dateTo = searchParams.get('to')?.trim() || '';

  let sql = `
    SELECT p.id, p.receipt_no, p.invoice_id, p.amount, p.method, p.reference, p.paid_on, p.created_at,
           u.name as collector_name,
           s.id as student_id, s.full_name as student_name, s.admission_no,
           c.name as class_name, sec.name as section_name,
           i.title as invoice_title
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN students s ON i.student_id = s.id
    LEFT JOIN users u ON p.received_by = u.id
    LEFT JOIN enrollments e ON s.id = e.student_id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (q) {
    sql += ` AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR p.receipt_no LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (method) {
    sql += ` AND p.method = ?`;
    params.push(method);
  }
  if (dateFrom) {
    sql += ` AND p.paid_on >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND p.paid_on <= ?`;
    params.push(dateTo);
  }

  sql += ` ORDER BY p.id DESC LIMIT 100`;

  const payments = await query(sql, params);
  return json({ items: payments });
});
