import { requireUser } from '@/server/guard';
import { handle, json } from '@/server/http';
import { getMonthCalendarStatus, getCalendarContext, seedNepalHolidaysIfEmpty } from '@/server/services/calendar';
import { todayNPT } from '@/lib/calendar';
import { one } from '@/server/db';

export const GET = handle(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || todayNPT().slice(0, 7);

  const currentYear = await one<{ id: number }>('SELECT id FROM academic_years WHERE is_current = 1');
  const yearId = currentYear?.id ?? 1;

  // Ensure calendar holidays are seeded
  await seedNepalHolidaysIfEmpty(yearId);

  const [days, ctx] = await Promise.all([
    getMonthCalendarStatus(month, yearId),
    getCalendarContext(yearId),
  ]);

  return json({
    month,
    weeklyOff: ctx.weeklyOff,
    days,
  });
});
