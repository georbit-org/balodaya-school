import { query, one, run } from '@/server/db';
import { SETTINGS_REGISTRY } from './registry';

let settingsCache: Map<string, string> | null = null;

export async function getAllSettings(): Promise<Record<string, string>> {
  if (settingsCache) {
    return Object.fromEntries(settingsCache.entries());
  }

  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM school_settings');
  const cache = new Map<string, string>();

  // Fill defaults first from registry
  for (const [key, def] of Object.entries(SETTINGS_REGISTRY)) {
    cache.set(key, def.defaultValue);
  }

  // Override with database values
  for (const row of rows) {
    cache.set(row.key, row.value);
  }

  settingsCache = cache;
  return Object.fromEntries(cache.entries());
}

export async function getSetting<T = string>(key: string): Promise<T> {
  const all = await getAllSettings();
  if (key in all) {
    const raw = all[key];
    const def = SETTINGS_REGISTRY[key];
    if (def?.type === 'number') {
      return Number(raw) as unknown as T;
    }
    if (def?.type === 'boolean') {
      return (raw === 'true' || raw === '1') as unknown as T;
    }
    if (def?.type === 'json') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return [] as unknown as T;
      }
    }
    return raw as unknown as T;
  }

  const def = SETTINGS_REGISTRY[key];
  if (def) {
    if (def.type === 'number') return Number(def.defaultValue) as unknown as T;
    if (def.type === 'boolean') return (def.defaultValue === 'true') as unknown as T;
    if (def.type === 'json') {
      try {
        return JSON.parse(def.defaultValue) as T;
      } catch {
        return [] as unknown as T;
      }
    }
    return def.defaultValue as unknown as T;
  }

  return '' as unknown as T;
}

export async function setSetting(
  key: string,
  value: string,
  changedBy: number,
  reason = 'Admin updated setting'
): Promise<void> {
  const existing = await one<{ value: string }>('SELECT value FROM school_settings WHERE key = ?', [key]);
  const oldValue = existing ? existing.value : (SETTINGS_REGISTRY[key]?.defaultValue ?? '');

  await run(
    `INSERT INTO school_settings (key, value, updated_by, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_by = excluded.updated_by,
       updated_at = excluded.updated_at`,
    [key, String(value), changedBy]
  );

  // Record audit history
  await run(
    `INSERT INTO settings_history (key, old_value, new_value, changed_by, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [key, oldValue, String(value), changedBy, reason]
  );

  // Invalidate cache
  settingsCache = null;
}

export async function initializeDefaultSettings(): Promise<void> {
  for (const [key, def] of Object.entries(SETTINGS_REGISTRY)) {
    const exists = await one('SELECT key FROM school_settings WHERE key = ?', [key]);
    if (!exists) {
      await run(
        `INSERT OR IGNORE INTO school_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
        [key, def.defaultValue]
      );
    }
  }
}
