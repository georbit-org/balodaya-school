import { requireRole, requireUser } from '@/server/guard';
import { one, run } from '@/server/db';
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
