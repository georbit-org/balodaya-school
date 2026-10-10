import { run, query } from '@/server/db';

export interface AuditEntry {
  id: number;
  user_id: number | null;
  user_name?: string;
  action: string;
  entity: string | null;
  entity_id: number | null;
  detail: string | null;
  created_at: string;
}

export async function recordAudit(
  userId: number | null,
  action: string,
  entity?: string,
  entityId?: number,
  detail?: string
): Promise<void> {
  try {
    await run(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [userId, action, entity ?? null, entityId ?? null, detail ?? null]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function getRecentAudit(limit = 10): Promise<AuditEntry[]> {
  try {
    return await query<AuditEntry>(
      `SELECT a.id, a.user_id, u.name as user_name, a.action, a.entity, a.entity_id, a.detail, a.created_at
       FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.id DESC
       LIMIT ?`,
      [limit]
    );
  } catch (err) {
    console.error('Failed to get recent audit:', err);
    return [];
  }
}
