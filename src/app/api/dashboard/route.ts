import { requireUser } from '@/server/guard';
import { handle, json } from '@/server/http';
import { getDashboardData } from '@/server/services/dashboard';

export const GET = handle(async () => {
  const user = await requireUser();
  try {
    const data = await getDashboardData(user);
    return json(data);
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : null }, 500);
  }
});
