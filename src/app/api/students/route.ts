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

  let sql = `
    SELECT s.id, s.admission_no, s.full_name, s.gender, s.dob, s.address, s.status, s.admitted_on,
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
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  // Role permissions
  if (user.role === 'parent') {
    sql += ` AND s.id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)`;
    args.push(user.id);
  } else if (user.role === 'student') {
    sql += ` AND s.user_id = ?`;
    args.push(user.id);
  }

  if (status) {
    sql += ' AND s.status = ?';
    args.push(status);
  }
  if (classId) {
    sql += ' AND c.id = ?';
    args.push(classId);
  }
  if (sectionId) {
    sql += ' AND sec.id = ?';
    args.push(sectionId);
  }
  if (houseId) {
    sql += ' AND s.house_id = ?';
    args.push(houseId);
  }
  if (q) {
    sql += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR g.phone LIKE ? OR g.name LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term, term);
  }

  sql += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
  args.push(pageSize, offset);

  const items = await query(sql, args);

  // Total count
  let countSql = 'SELECT count(*) as total FROM students s WHERE 1=1';
  const countArgs: (string | number)[] = [];
  if (user.role === 'parent') {
    countSql += ' AND s.id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)';
    countArgs.push(user.id);
  } else if (user.role === 'student') {
    countSql += ' AND s.user_id = ?';
    countArgs.push(user.id);
  }
  if (status) {
    countSql += ' AND s.status = ?';
    countArgs.push(status);
  }
  if (q) {
    countSql += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ?)';
    const term = `%${q}%`;
    countArgs.push(term, term);
  }

  const countRow = await one<{ total: number }>(countSql, countArgs);

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
