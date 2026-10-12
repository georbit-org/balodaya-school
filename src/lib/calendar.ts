import NepaliDateConverter from 'nepali-date-converter';

// Handle both ESM and CJS bundle imports of nepali-date-converter
interface NepaliDateInstance {
  getYear(): number;
  getMonth(): number;
  getDate(): number;
  format(fmt: string, lang?: string): string;
}
type NepaliDateConstructor = new (arg?: string | Date | number) => NepaliDateInstance;

const NepaliDate: NepaliDateConstructor = (
  (NepaliDateConverter as unknown as { default?: NepaliDateConstructor })?.default || NepaliDateConverter
) as unknown as NepaliDateConstructor;

export const NPT_OFFSET_MINUTES = 345; // UTC+5:45 (Asia/Kathmandu)

export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAYS_NE = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहिबार',
  'शुक्रबार',
  'शनिबार',
] as const;

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भाद्र',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
] as const;

export interface CalendarContext {
  weeklyOff: number[]; // 0=Sunday, 6=Saturday
  holidays: Set<string>;
}

/**
 * Returns current timestamp in Nepal Time (NPT = UTC+5:45)
 */
export function nowNPT(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + NPT_OFFSET_MINUTES * 60000);
}

/**
 * Returns current date in Nepal Time as 'YYYY-MM-DD' string
 */
export function todayNPT(): string {
  const d = nowNPT();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse 'YYYY-MM-DD' into components safely
 */
export function parseYMD(dateStr: string): { y: number; m: number; d: number } {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid YYYY-MM-DD format: ${dateStr}`);
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    throw new Error(`Non-numeric date parts in: ${dateStr}`);
  }
  return { y, m, d };
}

/**
 * Format numbers into 'YYYY-MM-DD'
 */
export function formatYMD(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Add or subtract days from a 'YYYY-MM-DD' string in UTC arithmetic
 */
export function addDays(dateStr: string, days: number): string {
  const { y, m, d } = parseYMD(dateStr);
  const dateUtc = new Date(Date.UTC(y, m - 1, d));
  dateUtc.setUTCDate(dateUtc.getUTCDate() + days);
  return dateUtc.toISOString().slice(0, 10);
}

/**
 * Returns day of week (0=Sunday .. 6=Saturday) without any timezone shifting
 */
export function dayOfWeek(dateStr: string): number {
  const { y, m, d } = parseYMD(dateStr);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Get weekday name in English
 */
export function dayName(dow: number): string {
  return WEEKDAYS_EN[dow] ?? 'Unknown';
}

/**
 * Get weekday name in Nepali
 */
export function dayNameNe(dow: number): string {
  return WEEKDAYS_NE[dow] ?? 'अज्ञात';
}

/**
 * Generate an inclusive array of 'YYYY-MM-DD' dates between from and to.
 * Safeguarded to maximum 400 days to prevent infinite loops.
 */
export function eachDay(fromStr: string, toStr: string): string[] {
  if (fromStr > toStr) return [];
  const days: string[] = [];
  let curr = fromStr;
  let count = 0;
  while (curr <= toStr && count < 400) {
    days.push(curr);
    curr = addDays(curr, 1);
    count++;
  }
  return days;
}

/**
 * Checks whether a given 'YYYY-MM-DD' is a working school day.
 * Returns false if it falls on a configured weekly off day or an active holiday.
 */
export function isWorkingDay(dateStr: string, ctx: CalendarContext): boolean {
  const dow = dayOfWeek(dateStr);
  if (ctx.weeklyOff.includes(dow)) {
    return false;
  }
  const holidaySet = ctx.holidays instanceof Set ? ctx.holidays : new Set(ctx.holidays);
  if (holidaySet.has(dateStr)) {
    return false;
  }
  return true;
}

/**
 * Counts the actual number of school working days in a date range [fromStr, toStr].
 */
export function workingDaysBetween(
  fromStr: string,
  toStr: string,
  ctx: CalendarContext
): number {
  if (fromStr > toStr) return 0;
  const days = eachDay(fromStr, toStr);
  let count = 0;
  for (const d of days) {
    if (isWorkingDay(d, ctx)) {
      count++;
    }
  }
  return count;
}

/**
 * Converts AD date 'YYYY-MM-DD' to Bikram Sambat (BS) details.
 */
export function toBS(dateStr: string): {
  year: number;
  month: number;
  day: number;
  formatted: string;
  monthName: string;
  monthNameNe: string;
} {
  const { y, m, d } = parseYMD(dateStr);
  const adDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  try {
    const nepali = new NepaliDate(adDate);
    const bsYear = nepali.getYear();
    const bsMonth = nepali.getMonth() + 1; // 1-indexed
    const bsDay = nepali.getDate();
    const formatted = `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
    const monthIdx = bsMonth - 1;
    return {
      year: bsYear,
      month: bsMonth,
      day: bsDay,
      formatted,
      monthName: BS_MONTHS_EN[monthIdx] || '',
      monthNameNe: BS_MONTHS_NE[monthIdx] || '',
    };
  } catch {
    return {
      year: y + 57,
      month: m,
      day: d,
      formatted: `${y + 57}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      monthName: 'Unknown',
      monthNameNe: 'अज्ञात',
    };
  }
}

/**
 * Format a date string in BS format for UI display
 */
export function formatBS(
  dateStr: string,
  options?: { lang?: 'en' | 'ne'; includeDayOfWeek?: boolean }
): string {
  const bs = toBS(dateStr);
  const dow = dayOfWeek(dateStr);
  const lang = options?.lang || 'en';

  if (lang === 'ne') {
    const dayNameStr = options?.includeDayOfWeek ? `${dayNameNe(dow)}, ` : '';
    return `${dayNameStr}${bs.day} ${bs.monthNameNe} ${bs.year}`;
  }

  const dayNameStr = options?.includeDayOfWeek ? `${dayName(dow)}, ` : '';
  return `${dayNameStr}${bs.monthName} ${bs.day}, ${bs.year} B.S.`;
}

/**
 * Returns academic month label in BS for an AD date (e.g. 'Ashwin 2083' or 'Baisakh 2083')
 */
export function academicMonthLabel(dateStr: string, lang: 'en' | 'ne' = 'en'): string {
  const bs = toBS(dateStr);
  if (lang === 'ne') {
    return `${bs.monthNameNe} ${bs.year}`;
  }
  return `${bs.monthName} ${bs.year}`;
}
