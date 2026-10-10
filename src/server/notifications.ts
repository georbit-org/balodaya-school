import { run, query } from '@/server/db';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
  read_at: string | null;
}

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT,
        href TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        read_at TEXT
      )
    `);
    await run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at)`);
    tableEnsured = true;
  } catch (e) {
    console.error('Failed to ensure notifications table:', e);
  }
}

export async function createNotification(
  userId: number,
  title: string,
  body?: string,
  href?: string
): Promise<void> {
  await ensureTable();
  try {
    await run(
      `INSERT INTO notifications (user_id, title, body, href, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, title, body ?? null, href ?? null]
    );
  } catch (err) {
    console.error('Failed to insert notification:', err);
  }
}

export async function getUserNotifications(userId: number, limit = 15): Promise<NotificationItem[]> {
  await ensureTable();
  try {
    return await query<NotificationItem>(
      `SELECT id, user_id, title, body, href, created_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT ?`,
      [userId, limit]
    );
  } catch (err) {
    console.error('Failed to fetch user notifications:', err);
    return [];
  }
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  await ensureTable();
  try {
    await run(
      `UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}
