import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

  if (!sectionId) {
    throw new HttpError(400, 'section_id is required.');
  }

  const section = await one<{
    id: number;
    name: string;
    class_name: string;
  }>(
    `SELECT sec.id, sec.name, c.name as class_name
     FROM sections sec
     JOIN classes c ON sec.class_id = c.id
     WHERE sec.id = ?`,
    [sectionId]
  );

  if (!section) throw new HttpError(404, 'Section not found.');

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  if (!currentYear) throw new HttpError(500, 'No active academic year.');

  // Distinct school attendance days in this month for this section
  const daysRow = await one<{ count: number }>(
    `SELECT count(DISTINCT a.date) as count
     FROM attendance a
     JOIN enrollments e ON a.enrollment_id = e.id
     WHERE e.section_id = ? AND e.academic_year_id = ? AND a.date LIKE ?`,
    [sectionId, currentYear.id, `${month}%`]
  );
  const totalDays = daysRow?.count ?? 0;

  // Student list in this section
  const students = await query<{
    enrollment_id: number;
    student_id: number;
    admission_no: string;
    full_name: string;
    roll_no: number | null;
  }>(
    `SELECT e.id as enrollment_id, s.id as student_id, s.admission_no, s.full_name, e.roll_no
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     WHERE e.section_id = ? AND e.academic_year_id = ? AND s.status = 'active'
     ORDER BY e.roll_no ASC, s.full_name ASC`,
    [sectionId, currentYear.id]
  );

  // Status counts per enrollment
  const attendanceCounts = await query<{
    enrollment_id: number;
    status: string;
    count: number;
  }>(
    `SELECT a.enrollment_id, a.status, count(*) as count
     FROM attendance a
     JOIN enrollments e ON a.enrollment_id = e.id
     WHERE e.section_id = ? AND e.academic_year_id = ? AND a.date LIKE ?
     GROUP BY a.enrollment_id, a.status`,
    [sectionId, currentYear.id, `${month}%`]
  );

  const statsMap = new Map<number, { present: number; absent: number; late: number; leave: number }>();
  for (const row of attendanceCounts) {
    if (!statsMap.has(row.enrollment_id)) {
      statsMap.set(row.enrollment_id, { present: 0, absent: 0, late: 0, leave: 0 });
    }
    const current = statsMap.get(row.enrollment_id)!;
    if (row.status === 'present') current.present = row.count;
    else if (row.status === 'absent') current.absent = row.count;
    else if (row.status === 'late') current.late = row.count;
    else if (row.status === 'leave') current.leave = row.count;
  }

  const resultList = students.map((s) => {
    const stats = statsMap.get(s.enrollment_id) || { present: 0, absent: 0, late: 0, leave: 0 };
    const attended = stats.present + stats.late;
    const percentage = totalDays > 0 ? Math.round((attended / totalDays) * 100) : 0;
    return {
      ...s,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      leave: stats.leave,
      totalMarked: stats.present + stats.absent + stats.late + stats.leave,
      percentage,
    };
  });

  return json({
    section,
    month,
    totalWorkingDays: totalDays,
    students: resultList,
  });
});
