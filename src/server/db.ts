import { createClient, type Client, type InArgs } from '@libsql/client';

let client: Client | null = null;
let foreignKeysEnabled = false;
let migrated = false;

async function applyMigrations(c: Client) {
  const migrations = [
    `ALTER TABLE exams ADD COLUMN status TEXT DEFAULT 'draft'`,
    `ALTER TABLE exams ADD COLUMN published_at TEXT`,
    `ALTER TABLE exams ADD COLUMN published_by INTEGER`,
    `ALTER TABLE marks ADD COLUMN is_absent INTEGER DEFAULT 0`,
    `ALTER TABLE marks ADD COLUMN updated_at TEXT`,
    `ALTER TABLE marks ADD COLUMN edit_reason TEXT`,
    `CREATE TABLE IF NOT EXISTS school_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_by INTEGER,
      reason TEXT,
      effective_from TEXT,
      changed_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS school_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      end_date TEXT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      title_ne TEXT,
      applies_to TEXT NOT NULL DEFAULT 'all',
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attendance_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      old_note TEXT,
      new_note TEXT,
      changed_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      changed_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      note TEXT,
      marked_by INTEGER,
      UNIQUE(user_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS leave_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      name_ne TEXT,
      audience TEXT,
      annual_quota REAL,
      requires_attachment_after_days INTEGER DEFAULT 2,
      paid INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS staff_leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      leave_type_id INTEGER NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      half_day INTEGER DEFAULT 0,
      working_days REAL NOT NULL,
      reason TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      approver_id INTEGER,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      review_note TEXT,
      substitute_user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS staff_leave_balances (
      user_id INTEGER NOT NULL,
      leave_type_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      allocated REAL DEFAULT 0,
      used REAL DEFAULT 0,
      PRIMARY KEY (user_id, leave_type_id, academic_year_id)
    )`,
    `CREATE TABLE IF NOT EXISTS leave_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_kind TEXT NOT NULL,
      request_id INTEGER NOT NULL,
      actor_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS approval_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applies_to TEXT NOT NULL,
      applicant_role TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS approval_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      step_no INTEGER NOT NULL,
      approver_kind TEXT NOT NULL,
      approver_value TEXT NOT NULL,
      escalate_after_hours INTEGER DEFAULT 48,
      can_skip_if_unavailable INTEGER DEFAULT 1
    )`,
    `ALTER TABLE leave_requests ADD COLUMN leave_type TEXT`,
    `ALTER TABLE leave_requests ADD COLUMN working_days INTEGER`,
    `ALTER TABLE leave_requests ADD COLUMN attachment_url TEXT`,
    `ALTER TABLE leave_requests ADD COLUMN escalated_to INTEGER`,
    `ALTER TABLE leave_requests ADD COLUMN cancelled_at TEXT`,
    `ALTER TABLE leave_requests ADD COLUMN cancel_reason TEXT`,
    `ALTER TABLE leave_requests ADD COLUMN half_day INTEGER DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS idx_calendar_date ON school_calendar(date)`,
    `CREATE INDEX IF NOT EXISTS idx_staff_att_date ON staff_attendance(date)`,
    `CREATE INDEX IF NOT EXISTS idx_staff_leave_status ON staff_leave_requests(status)`,
    `CREATE INDEX IF NOT EXISTS idx_leave_req_status ON leave_requests(status)`,
    `CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      original_name TEXT,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      alt_text TEXT NOT NULL,
      alt_text_ne TEXT,
      caption TEXT,
      folder TEXT DEFAULT 'general',
      tags TEXT,
      focal_x REAL DEFAULT 0.5,
      focal_y REAL DEFAULT 0.5,
      visibility TEXT NOT NULL DEFAULT 'public',
      uploaded_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS cms_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      title_ne TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_image_media_id INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      show_in_nav INTEGER DEFAULT 0,
      nav_label TEXT,
      nav_label_ne TEXT,
      nav_order INTEGER DEFAULT 100,
      nav_parent_id INTEGER,
      is_system INTEGER DEFAULT 0,
      published_version_id INTEGER,
      updated_by INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS cms_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL,
      schedule_from TEXT,
      schedule_to TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS cms_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS site_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone TEXT NOT NULL,
      label TEXT NOT NULL,
      label_ne TEXT,
      href TEXT NOT NULL,
      page_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      open_new_tab INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_path TEXT NOT NULL UNIQUE,
      to_path TEXT NOT NULL,
      permanent INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS labels (
      key TEXT PRIMARY KEY,
      en TEXT NOT NULL,
      ne TEXT,
      group_name TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS templates (
      key TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      subject TEXT,
      body_en TEXT NOT NULL,
      body_ne TEXT,
      updated_by INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS lookups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      code TEXT NOT NULL,
      label TEXT NOT NULL,
      label_ne TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      UNIQUE(kind, code)
    )`,
    `CREATE TABLE IF NOT EXISTS custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      label_ne TEXT,
      type TEXT NOT NULL,
      options TEXT,
      required INTEGER DEFAULT 0,
      visible_roles TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      UNIQUE(entity, key)
    )`,
    `CREATE TABLE IF NOT EXISTS custom_values (
      field_id INTEGER NOT NULL,
      entity_id INTEGER NOT NULL,
      value TEXT,
      PRIMARY KEY (field_id, entity_id)
    )`,
    `CREATE TABLE IF NOT EXISTS role_permission_overrides (
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      allowed INTEGER NOT NULL,
      reason TEXT,
      changed_by INTEGER,
      changed_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (role, action)
    )`,
    `CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE INDEX IF NOT EXISTS idx_media_visibility ON media(visibility)`,
    `CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_cms_sections_page ON cms_sections(page_id, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_site_menu_zone ON site_menu(zone, sort_order)`,
    `ALTER TABLE hero_slides ADD COLUMN media_id INTEGER REFERENCES media(id)`
  ];
  for (const sql of migrations) {
    try {
      await c.execute(sql);
    } catch {
      // Column/table already exists or handled
    }
  }
}

export function db(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? 'file:data/balodaya.db';
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    client = createClient({ url, authToken });
  }

  if (!foreignKeysEnabled && client) {
    foreignKeysEnabled = true;
    client.execute('PRAGMA foreign_keys = ON').catch(() => {
      // Ignore if pragma is already applied
    });
  }

  if (!migrated && client) {
    migrated = true;
    applyMigrations(client).catch(() => {});
  }

  return client;
}

export async function query<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const result = await db().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  const result = await db().execute({ sql, args });
  if (result.rows.length === 0) return undefined;
  return result.rows[0] as unknown as T;
}

export async function run(
  sql: string,
  args: InArgs = []
): Promise<{ lastInsertRowid: bigint | number; rowsAffected: number }> {
  const result = await db().execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid ?? 0,
    rowsAffected: result.rowsAffected,
  };
}

export async function batch(
  statements: Array<{ sql: string; args?: InArgs }>
): Promise<void> {
  await db().batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    'write'
  );
}

