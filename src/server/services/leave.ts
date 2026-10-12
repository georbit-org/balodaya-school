import { one, run } from '@/server/db';

export async function ensureDefaultLeaveTypes(): Promise<void> {
  const existing = await one<{ count: number }>('SELECT count(*) as count FROM leave_types');
  if (existing && existing.count > 0) return;

  const types = [
    {
      code: 'CL',
      name: 'Casual Leave (भैपरी आउने बिदा)',
      name_ne: 'भैपरी आउने बिदा',
      audience: 'both',
      annual_quota: 6,
      requires_attachment_after_days: 3,
      paid: 1,
    },
    {
      code: 'SL',
      name: 'Sick Leave (बिरामी बिदा)',
      name_ne: 'बिरामी बिदा',
      audience: 'both',
      annual_quota: 12,
      requires_attachment_after_days: 2,
      paid: 1,
    },
    {
      code: 'FL',
      name: 'Festival / Family Leave (घरायसी बिदा)',
      name_ne: 'घरायसी बिदा',
      audience: 'both',
      annual_quota: 4,
      requires_attachment_after_days: 3,
      paid: 1,
    },
    {
      code: 'ML',
      name: 'Mourning / Bereavement Leave (किरिया बिदा)',
      name_ne: 'किरिया बिदा',
      audience: 'staff',
      annual_quota: 15,
      requires_attachment_after_days: 0,
      paid: 1,
    },
    {
      code: 'OD',
      name: 'Official Duty / Deputation (काज बिदा)',
      name_ne: 'काज बिदा',
      audience: 'staff',
      annual_quota: 10,
      requires_attachment_after_days: 0,
      paid: 1,
    },
    {
      code: 'LWP',
      name: 'Leave Without Pay (अवैतनिक बिदा)',
      name_ne: 'अवैतनिक बिदा',
      audience: 'staff',
      annual_quota: null,
      requires_attachment_after_days: 1,
      paid: 0,
    },
  ];

  for (const t of types) {
    await run(
      `INSERT OR IGNORE INTO leave_types (code, name, name_ne, audience, annual_quota, requires_attachment_after_days, paid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.code, t.name, t.name_ne, t.audience, t.annual_quota, t.requires_attachment_after_days, t.paid]
    );
  }
}
