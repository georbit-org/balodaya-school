/**
 * Date utilities localized to Nepal (Asia/Kathmandu, UTC+5:45).
 */

export function todayISO(d = new Date()): string {
  // Format as YYYY-MM-DD using Asia/Kathmandu timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

export function currentMonthISO(d = new Date()): string {
  return todayISO(d).slice(0, 7);
}

export function addDaysISO(days: number, from = new Date()): string {
  return todayISO(new Date(from.getTime() + days * 86400000));
}

export function currentDayOfWeekKathmandu(d = new Date()): number {
  // 0=Sun .. 6=Sat in Kathmandu timezone
  const dayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    weekday: 'short',
  }).format(d);

  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return days[dayStr] ?? d.getDay();
}
