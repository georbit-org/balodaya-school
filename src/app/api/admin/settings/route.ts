import { requireUser, requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { getAllSettings, setSetting, initializeDefaultSettings } from '@/server/settings';
import { SETTINGS_REGISTRY } from '@/server/settings/registry';
import { query } from '@/server/db';

export const GET = handle(async () => {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'principal') {
    throw new HttpError(403, 'Permission denied. Settings are restricted to administration.');
  }

  await initializeDefaultSettings();
  const settings = await getAllSettings();

  const history = await query<{
    id: number;
    key: string;
    old_value: string | null;
    new_value: string;
    changed_by_name: string;
    reason: string | null;
    changed_at: string;
  }>(`
    SELECT sh.id, sh.key, sh.old_value, sh.new_value, sh.reason, sh.changed_at,
           u.name as changed_by_name
    FROM settings_history sh
    LEFT JOIN users u ON sh.changed_by = u.id
    ORDER BY sh.id DESC
    LIMIT 50
  `);

  return json({
    settings,
    registry: SETTINGS_REGISTRY,
    history,
  });
});

export const PUT = handle(async (req: Request) => {
  const user = await requireRole('admin');
  const body = await req.json().catch(() => ({}));
  const { key, value, reason } = body;

  if (!key || typeof key !== 'string' || !SETTINGS_REGISTRY[key]) {
    throw new HttpError(400, `Invalid or unregistered settings key: ${key}`);
  }

  if (value === undefined || value === null) {
    throw new HttpError(400, 'Value is required.');
  }

  // Type validation
  const def = SETTINGS_REGISTRY[key];
  let stringVal = String(value);

  if (def.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) throw new HttpError(400, `${def.label} must be a valid number.`);
    stringVal = String(num);
  } else if (def.type === 'json') {
    try {
      if (typeof value === 'object') {
        stringVal = JSON.stringify(value);
      } else {
        JSON.parse(value);
        stringVal = value;
      }
    } catch {
      throw new HttpError(400, `${def.label} must be valid JSON.`);
    }
  }

  await setSetting(key, stringVal, user.id, reason || 'Admin updated setting');

  return json({
    success: true,
    key,
    value: stringVal,
  });
});
