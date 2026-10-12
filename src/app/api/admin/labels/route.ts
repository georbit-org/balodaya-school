import { requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { query, run } from '@/server/db';
import { audit } from '@/server/audit';

export interface LabelRow {
  key: string;
  en: string;
  ne: string | null;
  group_name: string | null;
}

const DEFAULT_LABELS: LabelRow[] = [
  { key: 'label_class', en: 'Class', ne: 'कक्षा', group_name: 'Academics' },
  { key: 'label_section', en: 'Section', ne: 'खण्ड', group_name: 'Academics' },
  { key: 'label_roll_no', en: 'Roll No', ne: 'रोल नम्बर', group_name: 'Academics' },
  { key: 'label_principal', en: 'Principal', ne: 'प्रधानाध्यापक', group_name: 'Staff' },
  { key: 'label_teacher', en: 'Teacher', ne: 'शिक्षक', group_name: 'Staff' },
  { key: 'label_fee', en: 'School Fee', ne: 'विद्यालय शुल्क', group_name: 'Finance' },
  { key: 'label_receipt', en: 'Payment Receipt', ne: 'भुक्तानी रसिद', group_name: 'Finance' },
  { key: 'label_attendance', en: 'Attendance', ne: 'हाजिरी', group_name: 'Attendance' },
  { key: 'label_leave', en: 'Leave Request', ne: 'बिदा निवेदन', group_name: 'Leave' },
  { key: 'label_exam', en: 'Examination', ne: 'परीक्षा', group_name: 'Academics' },
  { key: 'label_admissions', en: 'Admissions', ne: 'भर्ना', group_name: 'Admissions' },
  { key: 'label_report_card', en: 'Report Card', ne: 'प्रगति विवरण', group_name: 'Academics' },
  { key: 'label_notice', en: 'Notice Board', ne: 'सूचना पाटी', group_name: 'General' },
];

export const GET = handle(async () => {
  await requireRole('admin');

  // Seed any missing defaults
  for (const d of DEFAULT_LABELS) {
    await run(
      'INSERT INTO labels (key, en, ne, group_name) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO NOTHING',
      [d.key, d.en, d.ne, d.group_name]
    );
  }

  const rows = await query<LabelRow>('SELECT * FROM labels ORDER BY group_name ASC, key ASC');
  return json(rows);
});

export const PUT = handle(async (req: Request) => {
  const adminUser = await requireRole('admin');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object' || !body.key || !body.en) {
    throw new HttpError(400, 'key and en string are required.');
  }

  const { key, en, ne, group_name } = body;

  await run(
    `INSERT INTO labels (key, en, ne, group_name)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       en = excluded.en,
       ne = excluded.ne,
       group_name = excluded.group_name`,
    [key, en.trim(), ne?.trim() || null, group_name?.trim() || null]
  );

  await audit(adminUser.id, 'update_label', 'labels', null, { key, en, ne });

  return json({ message: `Label "${key}" updated successfully.` });
});
