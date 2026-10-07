import { requireRole, requireUser } from '@/server/guard';
import { query, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  await requireUser();

  const [heads, structures] = await Promise.all([
    query<{ id: number; name: string }>('SELECT id, name FROM fee_heads ORDER BY id ASC'),
    query<{
      id: number;
      class_id: number;
      class_name: string;
      fee_head_id: number;
      fee_head_name: string;
      amount: number;
    }>(`
      SELECT fs.id, fs.class_id, c.name as class_name,
             fs.fee_head_id, fh.name as fee_head_name, fs.amount
      FROM fee_structure fs
      JOIN classes c ON fs.class_id = c.id
      JOIN fee_heads fh ON fs.fee_head_id = fh.id
      ORDER BY c.sort_order ASC, fh.id ASC
    `),
  ]);

  return json({ heads, structures });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'accountant');

  const body = await req.json().catch(() => ({}));
  const { class_id, fee_head_id, amount } = body;

  if (!class_id || !fee_head_id || amount === undefined || amount === null) {
    throw new HttpError(400, 'class_id, fee_head_id, and amount are required.');
  }

  const numAmount = parseInt(String(amount), 10);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new HttpError(400, 'Amount must be a non-negative integer.');
  }

  await run(
    `INSERT INTO fee_structure (class_id, fee_head_id, amount)
     VALUES (?, ?, ?)
     ON CONFLICT(class_id, fee_head_id) DO UPDATE SET amount = excluded.amount`,
    [class_id, fee_head_id, numAmount]
  );

  return json({ success: true, class_id, fee_head_id, amount: numAmount });
});
