import assert from 'node:assert/strict';
import { query } from '../src/server/db.ts';

console.log('Running Balodaya SMS Database Schema Verification...\n');

const requiredTables = [
  // Core School Management Tables
  'school_settings',
  'settings_history',
  'school_calendar',
  'attendance',
  'attendance_history',
  'staff_attendance',
  'leave_requests',
  'leave_types',
  'staff_leave_requests',
  'staff_leave_balances',
  'leave_events',
  'approval_workflows',
  'approval_steps',
  // Media & Total Admin CMS Tables
  'media',
  'cms_pages',
  'cms_sections',
  'cms_versions',
  'site_menu',
  'redirects',
  'labels',
  'templates',
  'lookups',
  'custom_fields',
  'custom_values',
  'role_permission_overrides',
  'feature_flags',
];

const rows = await query("SELECT name FROM sqlite_master WHERE type='table'");
const existing = new Set(rows.map((r) => r.name));

let missing = 0;
for (const table of requiredTables) {
  if (existing.has(table)) {
    console.log(`  ✓ Table "${table}" exists`);
  } else {
    console.error(`  ✗ MISSING table "${table}"`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`\nFailed: ${missing} table(s) missing from database schema.`);
  process.exit(1);
} else {
  console.log(`\nAll ${requiredTables.length} required database tables verified! ✓`);
  process.exit(0);
}
