import { query, one, run } from '@/server/db';
import { getSetting } from '@/server/settings';
import {
  dayOfWeek,
  dayName,
  eachDay,
  type CalendarContext,
} from '@/lib/calendar';
import { HttpError } from '@/server/http';

export interface CalendarHolidayRow {
  id: number;
  date: string;
  end_date: string | null;
  kind: 'holiday' | 'vacation' | 'exam_day' | 'event' | 'half_day' | 'working_override';
  title: string;
  title_ne: string | null;
  applies_to: 'all' | 'students' | 'staff';
}

export async function getCalendarContext(
  academicYearId?: number,
  audience: 'all' | 'students' | 'staff' = 'all'
): Promise<CalendarContext & { holidayDetails: Map<string, CalendarHolidayRow> }> {
  // 1. Get weekly off days from settings
  const weeklyOff = await getSetting<number[]>('weekly_off_days');

  // 2. Resolve academic year
  let yearId = academicYearId;
  if (!yearId) {
    const current = await one<{ id: number }>(
      'SELECT id FROM academic_years WHERE is_current = 1'
    );
    yearId = current?.id ?? 1;
  }

  // 3. Query holidays & overrides from school_calendar
  let sql = `
    SELECT id, date, end_date, kind, title, title_ne, applies_to
    FROM school_calendar
    WHERE academic_year_id = ?
  `;
  const args: Array<string | number> = [yearId];

  if (audience !== 'all') {
    sql += ` AND (applies_to = 'all' OR applies_to = ?)`;
    args.push(audience);
  }

  const rows = await query<CalendarHolidayRow>(sql, args);
  const holidays = new Set<string>();
  const holidayDetails = new Map<string, CalendarHolidayRow>();

  for (const row of rows) {
    if (row.kind === 'holiday' || row.kind === 'vacation') {
      if (row.end_date && row.end_date >= row.date) {
        const days = eachDay(row.date, row.end_date);
        for (const d of days) {
          holidays.add(d);
          holidayDetails.set(d, row);
        }
      } else {
        holidays.add(row.date);
        holidayDetails.set(row.date, row);
      }
    }
  }

  return {
    weeklyOff: Array.isArray(weeklyOff) && weeklyOff.length > 0 ? weeklyOff : [6],
    holidays,
    holidayDetails,
  };
}

/**
 * Asserts that the given date is a valid, open school working day.
 * Throws HttpError(422) with a descriptive message if the day is closed.
 */
export async function assertWorkingDay(
  dateStr: string,
  audience: 'all' | 'students' | 'staff' = 'all',
  academicYearId?: number
): Promise<void> {
  const ctx = await getCalendarContext(academicYearId, audience);
  const dow = dayOfWeek(dateStr);

  // Check weekly off day
  if (ctx.weeklyOff.includes(dow)) {
    const name = dayName(dow);
    throw new HttpError(
      422,
      `School is closed on ${name}. It is configured as a weekly off day. Attendance cannot be recorded.`
    );
  }

  // Check holiday
  if (ctx.holidays.has(dateStr)) {
    const holiday = ctx.holidayDetails.get(dateStr);
    const title = holiday?.title || 'an official holiday';
    throw new HttpError(
      422,
      `School is closed on ${dateStr} due to ${title}. Attendance cannot be recorded.`
    );
  }
}

/**
 * Returns month calendar days with status metadata for UI datepickers and attendance screens
 */
export async function getMonthCalendarStatus(
  monthStr: string, // YYYY-MM
  academicYearId?: number
): Promise<
  Array<{
    date: string;
    dayOfWeek: number;
    isWorkingDay: boolean;
    isWeeklyOff: boolean;
    holiday?: { title: string; titleNe?: string | null; kind: string };
  }>
> {
  const ctx = await getCalendarContext(academicYearId, 'all');
  const [yearStr, mStr] = monthStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(mStr, 10);

  // Determine number of days in month
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: Array<{
    date: string;
    dayOfWeek: number;
    isWorkingDay: boolean;
    isWeeklyOff: boolean;
    holiday?: { title: string; titleNe?: string | null; kind: string };
  }> = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = dayOfWeek(dateStr);
    const isWeeklyOff = ctx.weeklyOff.includes(dow);
    const isHoliday = ctx.holidays.has(dateStr);
    const holidayDetail = ctx.holidayDetails.get(dateStr);

    days.push({
      date: dateStr,
      dayOfWeek: dow,
      isWeeklyOff,
      isWorkingDay: !isWeeklyOff && !isHoliday,
      holiday: holidayDetail
        ? {
            title: holidayDetail.title,
            titleNe: holidayDetail.title_ne,
            kind: holidayDetail.kind,
          }
        : undefined,
    });
  }

  return days;
}

/**
 * Seed realistic Nepal school calendar events for year 2083 BS (2026-2027 AD)
 */
export async function seedNepalHolidaysIfEmpty(academicYearId: number): Promise<void> {
  const existing = await one<{ count: number }>(
    'SELECT count(*) as count FROM school_calendar WHERE academic_year_id = ?',
    [academicYearId]
  );
  if (existing && existing.count > 0) return;

  const holidays: Array<{
    date: string;
    end_date?: string | null;
    kind: string;
    title: string;
    title_ne: string;
  }> = [
    {
      date: '2026-04-14',
      kind: 'holiday',
      title: 'Nepali New Year 2083 (नयाँ वर्ष)',
      title_ne: 'नयाँ वर्ष २०८३',
    },
    {
      date: '2026-05-01',
      kind: 'holiday',
      title: 'International Workers’ Day (मजदुर दिवस)',
      title_ne: 'मजदुर दिवस',
    },
    {
      date: '2026-05-31',
      kind: 'holiday',
      title: 'Buddha Jayanti / Ubhauli Parva (बुद्ध जयन्ती)',
      title_ne: 'बुद्ध जयन्ती',
    },
    {
      date: '2026-05-29',
      kind: 'holiday',
      title: 'Republic Day (गणतन्त्र दिवस)',
      title_ne: 'गणतन्त्र दिवस',
    },
    {
      date: '2026-08-19',
      kind: 'holiday',
      title: 'Janai Purnima / Rakshya Bandhan (जनै पूर्णिमा)',
      title_ne: 'जनै पूर्णिमा',
    },
    {
      date: '2026-08-26',
      kind: 'holiday',
      title: 'Gai Jatra (गाई जात्रा)',
      title_ne: 'गाई जात्रा',
    },
    {
      date: '2026-09-04',
      kind: 'holiday',
      title: 'Krishna Janmashtami (कृष्ण जन्माष्टमी)',
      title_ne: 'कृष्ण जन्माष्टमी',
    },
    {
      date: '2026-09-14',
      kind: 'holiday',
      title: 'Haritalika Teej (हरितालिका तीज)',
      title_ne: 'हरितालिका तीज',
    },
    {
      date: '2026-09-19',
      kind: 'holiday',
      title: 'Constitution Day (संविधान दिवस)',
      title_ne: 'संविधान दिवस',
    },
    {
      date: '2026-10-10',
      end_date: '2026-10-18',
      kind: 'vacation',
      title: 'Dashain Festival Vacation (बडा दसैं बिदा)',
      title_ne: 'बडा दसैं बिदा',
    },
    {
      date: '2026-10-27',
      end_date: '2026-10-31',
      kind: 'vacation',
      title: 'Tihar & Chhath Holidays (तिहार तथा छठ पर्व)',
      title_ne: 'तिहार तथा छठ पर्व',
    },
    {
      date: '2026-12-25',
      kind: 'holiday',
      title: 'Christmas Day',
      title_ne: 'क्रिसमस',
    },
    {
      date: '2027-01-15',
      kind: 'holiday',
      title: 'Maghe Sankranti (माघे संक्रान्ति)',
      title_ne: 'माघे संक्रान्ति',
    },
    {
      date: '2027-01-30',
      kind: 'holiday',
      title: 'Martyrs’ Day (शहीद दिवस)',
      title_ne: 'शहीद दिवस',
    },
    {
      date: '2027-02-16',
      kind: 'holiday',
      title: 'Maha Shivaratri (महाशिवरात्रि)',
      title_ne: 'महाशिवरात्रि',
    },
    {
      date: '2027-02-19',
      kind: 'holiday',
      title: 'National Democracy Day (राष्ट्रिय प्रजातन्त्र दिवस)',
      title_ne: 'प्रजातन्त्र दिवस',
    },
    {
      date: '2027-03-08',
      kind: 'holiday',
      title: 'International Women’s Day (अन्तर्राष्ट्रिय महिला दिवस)',
      title_ne: 'महिला दिवस',
    },
    {
      date: '2027-03-22',
      kind: 'holiday',
      title: 'Fagu Purnima / Holi Festival (होली पर्व)',
      title_ne: 'होली पर्व',
    },
  ];

  for (const h of holidays) {
    await run(
      `INSERT INTO school_calendar (academic_year_id, date, end_date, kind, title, title_ne, applies_to)
       VALUES (?, ?, ?, ?, ?, ?, 'all')`,
      [academicYearId, h.date, h.end_date || null, h.kind, h.title, h.title_ne]
    );
  }
}
