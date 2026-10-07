import { requireRole, requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'accountant');
  const user = await requireUser();

  const body = await req.json().catch(() => ({}));
  const { class_id, section_id, title, due_date } = body;

  if (!title?.trim()) {
    throw new HttpError(400, 'Invoice title (e.g. "Baisakh 2083 Monthly Fees") is required.');
  }

  const currentYear = await one<{ id: number; name: string }>(
    'SELECT id, name FROM academic_years WHERE is_current = 1'
  );
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Find target students
  let studentSql = `
    SELECT DISTINCT s.id as student_id, sec.class_id, sec.id as section_id
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN sections sec ON e.section_id = sec.id
    WHERE e.academic_year_id = ? AND s.status = 'active'
  `;
  const studentArgs: (string | number)[] = [currentYear.id];

  if (section_id) {
    studentSql += ' AND sec.id = ?';
    studentArgs.push(section_id);
  } else if (class_id) {
    studentSql += ' AND sec.class_id = ?';
    studentArgs.push(class_id);
  }

  const targetStudents = await query<{
    student_id: number;
    class_id: number;
    section_id: number;
  }>(studentSql, studentArgs);

  if (targetStudents.length === 0) {
    return json({ message: 'No active students found matching criteria.', generatedCount: 0, skippedCount: 0 });
  }

  // Count existing invoices for sequence formatting
  const maxRow = await one<{ max_num: number | null }>(
    'SELECT count(*) as max_num FROM invoices WHERE invoice_no LIKE ?',
    [`INV-${currentYear.name}-%`]
  );
  let seq = (maxRow?.max_num ?? 0) + 1;

  let generatedCount = 0;
  let skippedCount = 0;

  for (const st of targetStudents) {
    // Idempotent check
    const existing = await one(
      'SELECT id FROM invoices WHERE student_id = ? AND academic_year_id = ? AND title = ?',
      [st.student_id, currentYear.id, title.trim()]
    );
    if (existing) {
      skippedCount++;
      continue;
    }

    // Fee structure items for student's class
    const structureItems = await query<{ fee_head_name: string; amount: number }>(
      `SELECT fh.name as fee_head_name, fs.amount
       FROM fee_structure fs
       JOIN fee_heads fh ON fs.fee_head_id = fh.id
       WHERE fs.class_id = ?`,
      [st.class_id]
    );

    // Transport fee if assigned
    const transportFee = await one<{ monthly_fee: number; route_name: string }>(
      `SELECT tr.monthly_fee, tr.name as route_name
       FROM student_transport st_tr
       JOIN transport_routes tr ON st_tr.route_id = tr.id
       WHERE st_tr.student_id = ?`,
      [st.student_id]
    );

    const items: Array<{ description: string; amount: number }> = structureItems.map((item) => ({
      description: item.fee_head_name,
      amount: item.amount,
    }));

    if (transportFee && transportFee.monthly_fee > 0) {
      items.push({
        description: `Transport (${transportFee.route_name})`,
        amount: transportFee.monthly_fee,
      });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    if (total <= 0) {
      // If no fee rules configured, skip or generate 0 NPR invoice
      skippedCount++;
      continue;
    }

    const invoiceNo = `INV-${currentYear.name}-${String(seq).padStart(5, '0')}`;
    seq++;

    const invRes = await run(
      `INSERT INTO invoices (invoice_no, student_id, academic_year_id, title, due_date, total, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNo, st.student_id, currentYear.id, title.trim(), due_date || null, total, user.id]
    );
    const invoiceId = Number(invRes.lastInsertRowid);

    for (const item of items) {
      await run(
        'INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)',
        [invoiceId, item.description, item.amount]
      );
    }

    generatedCount++;
  }

  return json({
    success: true,
    generatedCount,
    skippedCount,
  }, 201);
});
