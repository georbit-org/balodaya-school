import { NextResponse } from 'next/server';
import { requireRole } from '@/server/guard';
import { query } from '@/server/db';
import { handle } from '@/server/http';

export const GET = handle(async () => {
  await requireRole('admin', 'principal', 'accountant');

  const rows = await query<{
    admission_no: string;
    full_name: string;
    gender: string | null;
    dob: string | null;
    status: string;
    class_name: string | null;
    section_name: string | null;
    roll_no: number | null;
    house_name: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    address: string | null;
  }>(`
    SELECT s.admission_no, s.full_name, s.gender, s.dob, s.status, s.address,
           h.name as house_name,
           c.name as class_name,
           sec.name as section_name,
           e.roll_no,
           g.name as guardian_name,
           g.phone as guardian_phone
    FROM students s
    LEFT JOIN houses h ON s.house_id = h.id
    LEFT JOIN enrollments e ON e.student_id = s.id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    LEFT JOIN student_guardians g ON g.student_id = s.id AND g.is_primary = 1
    ORDER BY s.admission_no ASC
  `);

  const headers = [
    'Admission No',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Status',
    'Class',
    'Section',
    'Roll No',
    'House',
    'Guardian Name',
    'Guardian Phone',
    'Address',
  ];

  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        escapeCsv(r.admission_no),
        escapeCsv(r.full_name),
        escapeCsv(r.gender),
        escapeCsv(r.dob),
        escapeCsv(r.status),
        escapeCsv(r.class_name),
        escapeCsv(r.section_name),
        escapeCsv(r.roll_no),
        escapeCsv(r.house_name),
        escapeCsv(r.guardian_name),
        escapeCsv(r.guardian_phone),
        escapeCsv(r.address),
      ].join(',')
    ),
  ];

  const csvContent = '\uFEFF' + csvLines.join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="balodaya-students.csv"',
    },
  });
});
