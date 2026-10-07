import { NextResponse } from 'next/server';
import { requireRole } from '@/server/guard';
import { query } from '@/server/db';
import { handle } from '@/server/http';

export const GET = handle(async (req: Request) => {
  await requireRole('admin', 'accountant', 'principal');
  const url = new URL(req.url);
  const classId = url.searchParams.get('class_id');

  let sql = `
    SELECT s.admission_no, s.full_name as student_name,
           c.name as class_name, sec.name as section_name,
           g.name as guardian_name, g.phone as guardian_phone,
           COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.student_id = s.id), 0) as total_billed,
           COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.student_id = s.id), 0) as total_paid
    FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    LEFT JOIN student_guardians g ON g.student_id = s.id AND g.is_primary = 1
    WHERE s.status = 'active'
  `;
  const args: (string | number)[] = [];

  if (classId) {
    sql += ' AND c.id = ?';
    args.push(classId);
  }

  sql += ' ORDER BY c.sort_order ASC, s.admission_no ASC';

  const rows = await query<{
    admission_no: string;
    student_name: string;
    class_name: string | null;
    section_name: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    total_billed: number;
    total_paid: number;
  }>(sql, args);

  const duesList = rows
    .map((r) => ({
      ...r,
      balance_due: Math.max(0, r.total_billed - r.total_paid),
    }))
    .filter((r) => r.balance_due > 0);

  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const headers = [
    'Admission No',
    'Student Name',
    'Class',
    'Section',
    'Guardian Name',
    'Guardian Phone',
    'Total Billed (NPR)',
    'Total Paid (NPR)',
    'Balance Due (NPR)',
  ];

  const lines = [
    headers.join(','),
    ...duesList.map((r) =>
      [
        escapeCsv(r.admission_no),
        escapeCsv(r.student_name),
        escapeCsv(r.class_name),
        escapeCsv(r.section_name),
        escapeCsv(r.guardian_name),
        escapeCsv(r.guardian_phone),
        escapeCsv(r.total_billed),
        escapeCsv(r.total_paid),
        escapeCsv(r.balance_due),
      ].join(',')
    ),
  ];

  const csv = '\uFEFF' + lines.join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fee-dues-report.csv"',
    },
  });
});
