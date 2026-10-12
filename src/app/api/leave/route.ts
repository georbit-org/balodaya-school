import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { getCalendarContext } from '@/server/services/calendar';
import { workingDaysBetween } from '@/lib/calendar';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  let sql = `
    SELECT lr.id, lr.student_id, lr.from_date, lr.to_date, lr.reason, lr.status,
           lr.leave_type, lr.working_days, lr.attachment_url,
           lr.reviewed_at, lr.review_note, lr.created_at,
           s.full_name as student_name, s.admission_no,
           c.name as class_name, sec.name as section_name,
           u_req.name as requested_by_name,
           u_rev.name as reviewed_by_name
    FROM leave_requests lr
    JOIN students s ON lr.student_id = s.id
    LEFT JOIN enrollments e ON e.student_id = s.id
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    LEFT JOIN users u_req ON lr.requested_by = u_req.id
    LEFT JOIN users u_rev ON lr.reviewed_by = u_rev.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (user.role === 'parent') {
    sql += ` AND lr.student_id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)`;
    args.push(user.id);
  } else if (user.role === 'student') {
    sql += ` AND s.user_id = ?`;
    args.push(user.id);
  } else if (user.role === 'teacher') {
    sql += ` AND (sec.class_teacher_id = ? OR sec.id IN (SELECT section_id FROM class_subjects WHERE teacher_id = ?))`;
    args.push(user.id, user.id);
  }

  if (statusFilter) {
    sql += ' AND lr.status = ?';
    args.push(statusFilter);
  }

  sql += ' ORDER BY lr.id DESC';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { student_id, from_date, to_date, reason, leave_type = 'Personal / Sick' } = body;

  let targetStudentId = student_id ? parseInt(student_id, 10) : null;

  if (user.role === 'student') {
    const own = await one<{ id: number }>('SELECT id FROM students WHERE user_id = ?', [user.id]);
    if (!own) throw new HttpError(404, 'Student record not found.');
    targetStudentId = own.id;
  } else if (user.role === 'parent') {
    if (!targetStudentId) {
      const child = await one<{ student_id: number }>(
        'SELECT student_id FROM student_guardians WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (!child) throw new HttpError(404, 'No child record linked.');
      targetStudentId = child.student_id;
    } else {
      const linked = await one(
        'SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?',
        [targetStudentId, user.id]
      );
      if (!linked) throw new HttpError(403, 'Permission denied.');
    }
  }

  if (!targetStudentId || !from_date || !to_date || !reason?.trim()) {
    throw new HttpError(400, 'Student, from date, to date, and reason are required.');
  }

  if (from_date > to_date) {
    throw new HttpError(400, 'From date cannot be after to date.');
  }

  // 1. Prevent overlapping pending or approved leave requests
  const overlap = await one(
    `SELECT id FROM leave_requests
     WHERE student_id = ? AND status IN ('pending', 'approved')
       AND NOT (to_date < ? OR from_date > ?)`,
    [targetStudentId, from_date, to_date]
  );
  if (overlap) {
    throw new HttpError(409, 'An existing leave request already covers all or part of these dates.');
  }

  // 2. Calculate real working days excluding holidays and weekly off days
  const calendarCtx = await getCalendarContext();
  const workingDays = workingDaysBetween(from_date, to_date, calendarCtx);

  if (workingDays === 0) {
    throw new HttpError(
      422,
      'The selected date range contains only non-school days (weekly off days / holidays). Leave cannot be requested.'
    );
  }

  const res = await run(
    `INSERT INTO leave_requests (student_id, from_date, to_date, reason, status, requested_by, leave_type, working_days)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [targetStudentId, from_date, to_date, reason.trim(), user.id, leave_type, workingDays]
  );

  return json({ id: Number(res.lastInsertRowid), workingDays }, 201);
});
