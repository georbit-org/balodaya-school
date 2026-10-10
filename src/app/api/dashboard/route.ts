import { requireUser } from '@/server/guard';
import { handle, json } from '@/server/http';
import { getDashboardData } from '@/server/services/dashboard';

export const GET = handle(async () => {
  const user = await requireUser();
  const data = await getDashboardData(user);
  return json(data);
});
