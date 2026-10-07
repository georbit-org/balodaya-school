import { destroySession } from '@/server/session';
import { handle, json } from '@/server/http';

export const POST = handle(async () => {
  await destroySession();
  return json({ success: true });
});
