import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal');

  const body = await req.json().catch(() => ({}));
  const {
    section_id,
    day_of_week,
    period,
    subject_id = null,
    teacher_id = null,
    start_time = null,
    end_time = null,
  } = body;

  if (section_id === undefined || day_of_week === undefined || period === undefined) {
    throw new HttpError(400, 'section_id, day_of_week, and period are required.');
  }

  const dayNum = parseInt(String(day_of_week), 10);
  const periodNum = parseInt(String(period), 10);
  const secId = parseInt(String(section_id), 10);

  if (isNaN(dayNum) || dayNum < 0 || dayNum > 5) {
    throw new HttpError(400, 'day_of_week must be between 0 (Sunday) and 5 (Friday).');
  }

  if (isNaN(periodNum) || periodNum < 1 || periodNum > 8) {
    throw new HttpError(400, 'period must be between 1 and 8.');
  }

  // If no subject assigned, clear the slot
  if (!subject_id) {
    await run(
      'DELETE FROM timetable_slots WHERE section_id = ? AND day_of_week = ? AND period = ?',
      [secId, dayNum, periodNum]
    );
    return json({ success: true, cleared: true });
  }

  // Teacher Collision Detection
  if (teacher_id) {
    const conflict = await one<{
      class_name: string;
      section_name: string;
    }>(
      `SELECT c.name as class_name, sec.name as section_name
       FROM timetable_slots ts
       JOIN sections sec ON ts.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       WHERE ts.teacher_id = ? AND ts.day_of_week = ? AND ts.period = ? AND ts.section_id != ?`,
      [teacher_id, dayNum, periodNum, secId]
    );

    if (conflict) {
      throw new HttpError(
        409,
        `Teacher schedule collision: Teacher is already scheduled for ${conflict.class_name} (${conflict.section_name}) during Period ${periodNum}.`
      );
    }
  }

  await run(
    `INSERT INTO timetable_slots (section_id, day_of_week, period, subject_id, teacher_id, start_time, end_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(section_id, day_of_week, period) DO UPDATE SET
       subject_id = excluded.subject_id,
       teacher_id = excluded.teacher_id,
       start_time = excluded.start_time,
       end_time = excluded.end_time`,
    [secId, dayNum, periodNum, subject_id, teacher_id || null, start_time, end_time]
  );

  return json({ success: true, section_id: secId, day_of_week: dayNum, period: periodNum });
});
