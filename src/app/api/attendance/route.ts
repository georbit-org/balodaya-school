import { requireUser } from '@/server/guard';
import { query, one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';
import { todayNPT, addDays } from '@/lib/calendar';
import { assertWorkingDay, getCalendarContext } from '@/server/services/calendar';
import { getSetting } from '@/server/settings';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const date = url.searchParams.get('date');
  const studentId = url.searchParams.get('student_id');
  const month = url.searchParams.get('month');

  // Student / Parent viewing monthly calendar for a specific student
  if (studentId || user.role === 'student' || user.role === 'parent') {
    let targetStudentId = studentId ? parseInt(studentId, 10) : null;
    if (user.role === 'student') {
      const student = await one<{ id: number }>('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!student) throw new HttpError(404, 'Student profile not found.');
      targetStudentId = student.id;
    } else if (user.role === 'parent') {
      if (!targetStudentId) {
        const firstChild = await one<{ student_id: number }>(
          'SELECT student_id FROM student_guardians WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        if (!firstChild) throw new HttpError(404, 'No children linked.');
        targetStudentId = firstChild.student_id;
      } else {
        const allowed = await one(
          'SELECT id FROM student_guardians WHERE student_id = ? AND user_id = ?',
          [targetStudentId, user.id]
        );
        if (!allowed) throw new HttpError(403, 'Permission denied.');
      }
    }

    const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
    const targetMonth = month || todayNPT().slice(0, 7); // YYYY-MM

    const records = await query<{
      date: string;
      status: string;
      note: string | null;
    }>(
      `SELECT a.date, a.status, a.note
       FROM attendance a
       JOIN enrollments e ON a.enrollment_id = e.id
       WHERE e.student_id = ? AND e.academic_year_id = ? AND a.date LIKE ?
       ORDER BY a.date ASC`,
      [targetStudentId, currentYear?.id ?? 0, `${targetMonth}%`]
    );

    return json({ studentId: targetStudentId, month: targetMonth, records });
  }

  // Teacher / Staff view of daily section roster
  if (!sectionId || !date) {
    throw new HttpError(400, 'section_id and date are required.');
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Teacher permission check
  if (user.role === 'teacher') {
    const isAssigned = await one(
      `SELECT id FROM sections WHERE id = ? AND class_teacher_id = ?
       UNION
       SELECT id FROM class_subjects WHERE section_id = ? AND teacher_id = ?`,
      [sectionId, user.id, sectionId, user.id]
    );
    if (!isAssigned) {
      throw new HttpError(403, 'You are not assigned to take attendance for this section.');
    }
  }

  // Check working day status
  const calendarCtx = await getCalendarContext(currentYear.id, 'students');
  const dow = new Date(date).getUTCDay();
  const isWeeklyOff = calendarCtx.weeklyOff.includes(dow);
  const isHoliday = calendarCtx.holidays.has(date);
  const holiday = calendarCtx.holidayDetails.get(date);

  let isWorkingDay = true;
  let closedReason = '';
  if (isWeeklyOff) {
    isWorkingDay = false;
    closedReason = 'Weekly Off Day';
  } else if (isHoliday) {
    isWorkingDay = false;
    closedReason = holiday?.title || 'Official Holiday';
  }

  // Find students on approved leave for this date
  const approvedLeaves = await query<{ student_id: number; reason: string }>(
    `SELECT student_id, reason
     FROM leave_requests
     WHERE status = 'approved' AND ? >= from_date AND ? <= to_date`,
    [date, date]
  );
  const leaveMap = new Map(approvedLeaves.map((l) => [l.student_id, l.reason]));

  const rows = await query<{
    enrollment_id: number;
    student_id: number;
    admission_no: string;
    full_name: string;
    roll_no: number | null;
    gender: string | null;
    status: 'present' | 'absent' | 'late' | 'leave' | null;
    note: string | null;
  }>(
    `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name,
            e.roll_no, s.gender, a.status, a.note
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     LEFT JOIN attendance a ON a.enrollment_id = e.id AND a.date = ?
     WHERE e.section_id = ? AND e.academic_year_id = ? AND s.status = 'active'
     ORDER BY e.roll_no ASC, s.full_name ASC`,
    [date, sectionId, currentYear.id]
  );

  const roster = rows.map((r) => {
    const hasApprovedLeave = leaveMap.has(r.student_id);
    return {
      ...r,
      hasApprovedLeave,
      status: r.status ? r.status : hasApprovedLeave ? ('leave' as const) : null,
      note: r.note || (hasApprovedLeave ? `Approved Leave: ${leaveMap.get(r.student_id)}` : null),
    };
  });

  return json({
    sectionId: parseInt(sectionId, 10),
    date,
    isWorkingDay,
    closedReason,
    roster,
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal' && user.role !== 'teacher') {
    throw new HttpError(403, 'Permission denied.');
  }

  const body = await req.json().catch(() => ({}));
  const { section_id, date, entries, records, edit_reason } = body;
  const rawEntries = Array.isArray(entries) ? entries : Array.isArray(records) ? records : [];

  if (!section_id || !date || rawEntries.length === 0) {
    throw new HttpError(400, 'section_id, date, and entries array are required.');
  }

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // 1. Enforce working day check
  await assertWorkingDay(date, 'students', currentYear.id);

  // 2. Prevent future dates (Nepal Time NPT)
  const today = todayNPT();
  if (date > today) {
    throw new HttpError(400, 'Attendance cannot be marked for future dates.');
  }

  // 3. Edit window check for teachers
  if (user.role === 'teacher') {
    const editWindowDays = await getSetting<number>('attendance_edit_window_days');
    const earliestAllowed = addDays(today, -Number(editWindowDays || 2));
    if (date < earliestAllowed) {
      throw new HttpError(
        403,
        `Attendance edit window (${editWindowDays} days) has expired for ${date}. Past corrections require Principal/Admin authorization.`
      );
    }
  }

  // Teacher section assignment check
  if (user.role === 'teacher') {
    const isAssigned = await one(
      `SELECT id FROM sections WHERE id = ? AND class_teacher_id = ?
       UNION
       SELECT id FROM class_subjects WHERE section_id = ? AND teacher_id = ?`,
      [section_id, user.id, section_id, user.id]
    );
    if (!isAssigned) {
      throw new HttpError(403, 'You are not assigned to take attendance for this section.');
    }
  }

  // Validate enrollments belong to this section
  const validEnrollments = await query<{ id: number }>(
    'SELECT id FROM enrollments WHERE section_id = ? AND academic_year_id = ?',
    [section_id, currentYear.id]
  );
  const validEnrollmentIds = new Set(validEnrollments.map((e) => e.id));

  // Upsert entries and log audit history on status changes
  for (const entry of rawEntries) {
    const { enrollment_id, status, note = null } = entry;
    if (!enrollment_id || !validEnrollmentIds.has(enrollment_id)) {
      continue;
    }
    if (!['present', 'absent', 'late', 'leave'].includes(status)) {
      continue;
    }

    const existing = await one<{ id: number; status: string; note: string | null }>(
      'SELECT id, status, note FROM attendance WHERE enrollment_id = ? AND date = ?',
      [enrollment_id, date]
    );

    if (existing) {
      if (existing.status !== status || existing.note !== note) {
        await run(
          `UPDATE attendance SET status = ?, note = ?, marked_by = ? WHERE id = ?`,
          [status, note, user.id, existing.id]
        );
        // Log to attendance_history
        await run(
          `INSERT INTO attendance_history (attendance_id, old_status, new_status, old_note, new_note, changed_by, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            existing.id,
            existing.status,
            status,
            existing.note,
            note,
            user.id,
            edit_reason || 'Roster updated',
          ]
        );
      }
    } else {
      await run(
        `INSERT INTO attendance (enrollment_id, date, status, note, marked_by)
         VALUES (?, ?, ?, ?, ?)`,
        [enrollment_id, date, status, note, user.id]
      );
    }
  }

  return json({ success: true, count: entries.length });
});
