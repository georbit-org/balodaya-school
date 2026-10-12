import { can, type Action, type Role } from '@/lib/permissions';
import { query } from '@/server/db';

interface OverrideRow {
  role: Role;
  action: Action;
  allowed: number;
}

let cachedOverrides: Map<string, boolean> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30_000;

export function invalidatePermissionCache(): void {
  cachedOverrides = null;
  lastCacheTime = 0;
}

async function getOverridesMap(): Promise<Map<string, boolean>> {
  const now = Date.now();
  if (cachedOverrides && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedOverrides;
  }

  try {
    const rows = await query<OverrideRow>(
      'SELECT role, action, allowed FROM role_permission_overrides'
    );
    const map = new Map<string, boolean>();
    for (const r of rows) {
      map.set(`${r.role}:${r.action}`, r.allowed === 1);
    }
    cachedOverrides = map;
    lastCacheTime = now;
    return map;
  } catch {
    // If table doesn't exist yet or query fails, return empty
    return new Map();
  }
}

/**
 * Server-side permission check that merges DB overrides on top of defaults.
 */
export async function canServer(role: Role | undefined | null, action: Action): Promise<boolean> {
  if (!role) return false;

  // Non-negotiable Admin guard rails (cannot be removed)
  if (role === 'admin') {
    if (
      action === 'settings.manage' ||
      action === 'user.manage' ||
      action === 'permissions.manage'
    ) {
      return true;
    }
  }

  const overrides = await getOverridesMap();
  const overrideKey = `${role}:${action}`;

  if (overrides.has(overrideKey)) {
    return overrides.get(overrideKey) ?? false;
  }

  return can(role, action);
}
