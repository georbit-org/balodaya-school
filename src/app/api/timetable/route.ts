import { requireUser } from '@/server/guard';
import { query, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const sectionId = url.searchParams.get('section_id');
  const teacherIdParam = url.searchParams.get('teacher_id');

  // Teacher viewing personal timetable
  let targetTeacherId = teacherIdParam ? parseInt(teacherIdParam, 10) : null;
  if (!sectionId && user.role === 'teacher') {
    targetTeacherId = user.id;
  }

  if (targetTeacherId) {
    const slots = await query<{
      id: number;
      section_id: number;
      class_name: string;
      section_name: string;
      day_of_week: number;
      period: number;
      start_time: string | null;
      end_time: string | null;
      subject_id: number | null;
      subject_name: string | null;
      teacher_name: string | null;
    }>(
      `SELECT ts.id, ts.section_id, c.name as class_name, sec.name as section_name,
              ts.day_of_week, ts.period, ts.start_time, ts.end_time,
              ts.subject_id, s.name as subject_name, u.name as teacher_name
       FROM timetable_slots ts
       JOIN sections sec ON ts.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       LEFT JOIN subjects s ON ts.subject_id = s.id
       LEFT JOIN users u ON ts.teacher_id = u.id
       WHERE ts.teacher_id = ?
       ORDER BY ts.day_of_week ASC, ts.period ASC`,
      [targetTeacherId]
    );

    return json({ teacherId: targetTeacherId, slots });
  }

  // Section timetable grid
  if (!sectionId) {
    throw new HttpError(400, 'section_id or teacher context is required.');
  }

  const section = await one<{
    id: number;
    name: string;
    class_id: number;
    class_name: string;
  }>(
    `SELECT sec.id, sec.name, sec.class_id, c.name as class_name
     FROM sections sec
     JOIN classes c ON sec.class_id = c.id
     WHERE sec.id = ?`,
    [sectionId]
  );
  if (!section) throw new HttpError(404, 'Section not found.');

  const slots = await query<{
    id: number;
    section_id: number;
    day_of_week: number;
    period: number;
    start_time: string | null;
    end_time: string | null;
    subject_id: number | null;
    subject_name: string | null;
    teacher_id: number | null;
    teacher_name: string | null;
  }>(
    `SELECT ts.id, ts.section_id, ts.day_of_week, ts.period,
            ts.start_time, ts.end_time,
            ts.subject_id, s.name as subject_name,
            ts.teacher_id, u.name as teacher_name
     FROM timetable_slots ts
     LEFT JOIN subjects s ON ts.subject_id = s.id
     LEFT JOIN users u ON ts.teacher_id = u.id
     WHERE ts.section_id = ?
     ORDER BY ts.day_of_week ASC, ts.period ASC`,
    [sectionId]
  );

  return json({ section, slots });
});
