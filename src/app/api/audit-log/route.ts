import { readSession } from '@/server/session';
import { getRecentAudit } from '@/server/audit';
import { jsonOk, jsonUnauthorized, jsonForbidden } from '@/server/http';

export async function GET() {
  const user = await readSession();
  if (!user) {
    return jsonUnauthorized();
  }

  if (user.role !== 'admin' && user.role !== 'principal') {
    return jsonForbidden();
  }

  const items = await getRecentAudit(50);
  return jsonOk({ items });
}
