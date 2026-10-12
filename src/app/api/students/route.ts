import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const classId = url.searchParams.get('class_id') || '';
  const sectionId = url.searchParams.get('section_id') || '';
  const houseId = url.searchParams.get('house_id') || '';
  const status = url.searchParams.get('status') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '25', 10));
  const offset = (page - 1) * pageSize;

  let whereSql = ' WHERE 1=1';
  const whereArgs: (string | number)[] = [];

  // Role permissions
  if (user.role === 'parent') {
    whereSql += ` AND s.id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)`;
    whereArgs.push(user.id);
  } else if (user.role === 'student') {
    whereSql += ` AND s.user_id = ?`;
    whereArgs.push(user.id);
  } else if (user.role === 'teacher') {
    whereSql += ` AND (sec.class_teacher_id = ? OR sec.class_id IN (SELECT class_id FROM class_subjects WHERE teacher_id = ?))`;
    whereArgs.push(user.id, user.id);
  }

  if (status) {
    whereSql += ' AND s.status = ?';
    whereArgs.push(status);
  }
  if (classId) {
    whereSql += ' AND c.id = ?';
    whereArgs.push(classId);
  }
  if (sectionId) {
    whereSql += ' AND sec.id = ?';
    whereArgs.push(sectionId);
  }
  if (houseId) {
    whereSql += ' AND s.house_id = ?';
    whereArgs.push(houseId);
  }
  if (q) {
    whereSql += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR g.phone LIKE ? OR g.name LIKE ?)';
    const term = `%${q}%`;
    whereArgs.push(term, term, term, term);
  }

  const baseFrom = `
    FROM students s
    LEFT JOIN houses h ON s.house_id = h.id
    LEFT JOIN enrollments e ON e.student_id = s.id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    LEFT JOIN student_guardians g ON g.student_id = s.id AND g.is_primary = 1
  `;

  const sql = `
    SELECT DISTINCT s.id, s.admission_no, s.full_name, s.gender, s.dob, s.address, s.status, s.admitted_on,
           h.name as house_name,
           c.name as class_name,
           sec.name as section_name,
           e.roll_no,
           g.name as guardian_name,
           g.phone as guardian_phone
    ${baseFrom}
    ${whereSql}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `;

  const items = await query<{
    id: number;
    admission_no: string;
    full_name: string;
    gender: string | null;
    dob: string | null;
    address: string | null;
    status: string;
    admitted_on: string | null;
    house_name: string | null;
    class_name: string | null;
    section_name: string | null;
    roll_no: number | null;
    guardian_name: string | null;
    guardian_phone: string | null;
  }>(sql, [...whereArgs, pageSize, offset]);

  // Strip sensitive PII if user is accountant
  if (user.role === 'accountant') {
    for (const item of items) {
      item.dob = null;
      item.address = null;
    }
  }

  // Count using identical filters
  const countSql = `SELECT count(DISTINCT s.id) as total ${baseFrom} ${whereSql}`;
  const countRow = await one<{ total: number }>(countSql, whereArgs);

  return json({
    items,
    total: countRow?.total ?? 0,
    page,
    pageSize,
  });
});

export const POST = handle(async (req: Request) => {
  const staff = await requireUser();
  if (staff.role !== 'admin' && staff.role !== 'principal') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const {
    full_name,
    gender = null,
    dob = null,
    address = null,
    section_id,
    house_id = null,
    guardian_name,
    guardian_phone,
    guardian_email = null,
  } = body;

  if (!full_name || !section_id || !guardian_name || !guardian_phone) {
    throw new HttpError(400, 'Student name, section, and guardian details are required.');
  }

  const currentYear = await one<{ id: number; name: string }>(
    'SELECT id, name FROM academic_years WHERE is_current = 1'
  );
  if (!currentYear) {
    throw new HttpError(500, 'No active academic year configured.');
  }

  // Generate admission number
  const countRow = await one<{ count: number }>(
    'SELECT count(*) as count FROM students WHERE admission_no LIKE ?',
    [`BAL-${currentYear.name}-%`]
  );
  const nextSeq = (countRow?.count ?? 0) + 1;
  const admissionNo = `BAL-${currentYear.name}-${String(nextSeq).padStart(4, '0')}`;

  const res = await run(
    `INSERT INTO students (admission_no, full_name, gender, dob, address, house_id, status, admitted_on)
     VALUES (?, ?, ?, ?, ?, ?, 'active', date('now'))`,
    [admissionNo, full_name.trim(), gender, dob, address, house_id || null]
  );
  const studentId = Number(res.lastInsertRowid);

  // Guardian
  await run(
    `INSERT INTO student_guardians (student_id, name, relation, phone, email, is_primary)
     VALUES (?, ?, 'Guardian', ?, ?, 1)`,
    [studentId, guardian_name.trim(), guardian_phone.trim(), guardian_email]
  );

  // Roll no
  const rollRow = await one<{ max_roll: number | null }>(
    'SELECT MAX(roll_no) as max_roll FROM enrollments WHERE section_id = ? AND academic_year_id = ?',
    [section_id, currentYear.id]
  );
  const rollNo = (rollRow?.max_roll ?? 0) + 1;

  await run(
    'INSERT INTO enrollments (student_id, academic_year_id, section_id, roll_no) VALUES (?, ?, ?, ?)',
    [studentId, currentYear.id, section_id, rollNo]
  );

  return json({ studentId, admissionNo, rollNo }, 201);
});
