import { readSession } from '@/server/session';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async () => {
  const user = await readSession();
  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return json({ user });
});
