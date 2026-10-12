import { requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { query, run } from '@/server/db';
import { audit } from '@/server/audit';

export interface ModuleFlag {
  key: string;
  name: string;
  description: string;
  category: 'Campus' | 'Academics' | 'Services' | 'Admin';
  enabled: boolean;
}

export const MODULE_DEFINITIONS: Array<Omit<ModuleFlag, 'enabled'>> = [
  {
    key: 'module_library',
    name: 'Library Management',
    description: 'Book catalog, checkout/returns, and reading history for students and staff.',
    category: 'Campus',
  },
  {
    key: 'module_transport',
    name: 'School Transport & Bus Routes',
    description: 'Bus route tracking, stops, and driver contact directory.',
    category: 'Services',
  },
  {
    key: 'module_houses',
    name: 'House System & Points',
    description: 'Inter-house points, athletic honors, and leaderboard standings.',
    category: 'Campus',
  },
  {
    key: 'module_resources',
    name: 'Academic Study Resources',
    description: 'Downloadable syllabus, past question papers, and study materials.',
    category: 'Academics',
  },
  {
    key: 'module_online_admissions',
    name: 'Online Admissions Portal',
    description: 'Public inquiry form and document upload for prospective parents.',
    category: 'Services',
  },
  {
    key: 'module_staff_attendance',
    name: 'Staff & Faculty Attendance',
    description: 'Daily check-in/check-out tracking for educators and school staff.',
    category: 'Admin',
  },
  {
    key: 'module_id_cards',
    name: 'Printable Student ID Cards',
    description: 'Automated barcode/QR ID cards generator formatted for standard ID printers.',
    category: 'Admin',
  },
  {
    key: 'module_sms_gateway',
    name: 'SMS Gateway Notifications',
    description: 'Automated SMS alerts to parents upon absence, fees, and results.',
    category: 'Services',
  },
  {
    key: 'module_parent_portal',
    name: 'Parent Portal Access',
    description: 'Web portal access for guardians to review attendance and payment records.',
    category: 'Services',
  },
  {
    key: 'module_fee_payment',
    name: 'Online Fee Collection',
    description: 'Online payments via eSewa, Khalti, and digital banking receipts.',
    category: 'Services',
  },
];

export const GET = handle(async () => {
  await requireRole('admin');

  const rows = await query<{ key: string; enabled: number }>('SELECT key, enabled FROM feature_flags');
  const flagMap = new Map(rows.map((r) => [r.key, Boolean(r.enabled)]));

  const flags: ModuleFlag[] = MODULE_DEFINITIONS.map((def) => ({
    ...def,
    enabled: flagMap.has(def.key) ? flagMap.get(def.key)! : true,
  }));

  return json(flags);
});

export const PUT = handle(async (req: Request) => {
  const adminUser = await requireRole('admin');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object' || !body.key || body.enabled === undefined) {
    throw new HttpError(400, 'key and enabled boolean are required.');
  }

  const { key, enabled } = body;

  await run(
    `INSERT INTO feature_flags (key, enabled)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled`,
    [key, enabled ? 1 : 0]
  );

  await audit(adminUser.id, 'toggle_module', 'feature_flags', null, { key, enabled });

  return json({ message: `Module ${key} updated successfully.`, key, enabled });
});
