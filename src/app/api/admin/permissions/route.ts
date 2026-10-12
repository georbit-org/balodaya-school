import { requireRole } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { query, run } from '@/server/db';
import { audit } from '@/server/audit';
import { Role, Action } from '@/lib/permissions';
import { invalidatePermissionCache } from '@/server/permissions';

export interface PermissionDefinition {
  action: Action;
  category: 'Students' | 'Leave' | 'Marks' | 'Fees' | 'Timetable' | 'CMS' | 'Settings';
  label: string;
  description: string;
  defaults: Record<Role, boolean>;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Students
  {
    action: 'student.create',
    category: 'Students',
    label: 'Create / Admit Students',
    description: 'Register new students and generate admission numbers.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },
  {
    action: 'student.view_all',
    category: 'Students',
    label: 'View Student Directory',
    description: 'Browse student roster, roll numbers, and profiles.',
    defaults: { admin: true, principal: true, teacher: true, accountant: true, parent: false, student: false },
  },
  {
    action: 'student.edit',
    category: 'Students',
    label: 'Edit Student Details',
    description: 'Modify bio, guardian contacts, address, and house.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },

  // Leave
  {
    action: 'leave.apply',
    category: 'Leave',
    label: 'Apply for Leave',
    description: 'Submit student leave request.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: true, student: true },
  },
  {
    action: 'leave.review',
    category: 'Leave',
    label: 'Approve / Reject Student Leave',
    description: 'Act as approver on student absence requests.',
    defaults: { admin: true, principal: true, teacher: true, accountant: false, parent: false, student: false },
  },
  {
    action: 'staff_leave.review',
    category: 'Leave',
    label: 'Decide Staff Leave',
    description: 'Principal review and decision on teacher/staff absence requests.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },

  // Marks & Exams
  {
    action: 'marks.enter',
    category: 'Marks',
    label: 'Enter Subject Marks',
    description: 'Input terminal examination scores and remarks.',
    defaults: { admin: true, principal: true, teacher: true, accountant: false, parent: false, student: false },
  },
  {
    action: 'marks.publish',
    category: 'Marks',
    label: 'Publish Final Examination Results',
    description: 'Release report cards and marks sheets to parents and students.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },

  // Fees
  {
    action: 'fee.record',
    category: 'Fees',
    label: 'Collect Fees & Issue Receipts',
    description: 'Process payments, generate receipts, and manage student dues.',
    defaults: { admin: true, principal: false, teacher: false, accountant: true, parent: false, student: false },
  },

  // Timetable
  {
    action: 'timetable.manage',
    category: 'Timetable',
    label: 'Schedule Timetable Slots',
    description: 'Assign periods, days, subjects, and teachers to sections.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },

  // CMS
  {
    action: 'cms.edit',
    category: 'CMS',
    label: 'Edit Website Pages & Sections',
    description: 'Create and edit public pages, headings, and copy.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },
  {
    action: 'cms.publish',
    category: 'CMS',
    label: 'Publish Website Pages Live',
    description: 'Push draft CMS pages to production visitors.',
    defaults: { admin: true, principal: false, teacher: false, accountant: false, parent: false, student: false },
  },
  {
    action: 'media.manage',
    category: 'CMS',
    label: 'Manage Media Library',
    description: 'Upload, inspect, replace, and delete media files.',
    defaults: { admin: true, principal: true, teacher: false, accountant: false, parent: false, student: false },
  },
  {
    action: 'menu.manage',
    category: 'CMS',
    label: 'Configure Site Menus',
    description: 'Add, reorder, and edit navigation links.',
    defaults: { admin: true, principal: false, teacher: false, accountant: false, parent: false, student: false },
  },

  // System Settings
  {
    action: 'settings.manage',
    category: 'Settings',
    label: 'System Settings Control Center',
    description: 'Configure academic years, holidays, policies, and workflows.',
    defaults: { admin: true, principal: false, teacher: false, accountant: false, parent: false, student: false },
  },
  {
    action: 'user.manage',
    category: 'Settings',
    label: 'User Account Management',
    description: 'Create, disable, and reset passwords for accounts.',
    defaults: { admin: true, principal: false, teacher: false, accountant: false, parent: false, student: false },
  },
];

export const GET = handle(async () => {
  await requireRole('admin');

  const overrides = await query<{
    role: string;
    action: string;
    allowed: number;
    reason: string | null;
    changed_by: number | null;
    changed_at: string;
  }>('SELECT * FROM role_permission_overrides');

  return json({
    roles: ['principal', 'teacher', 'accountant', 'parent', 'student'],
    definitions: PERMISSION_DEFINITIONS,
    overrides,
  });
});

export const PUT = handle(async (req: Request) => {
  const adminUser = await requireRole('admin');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required.');
  }

  const { role, action, allowed, reason } = body;

  if (!role || !action || allowed === undefined) {
    throw new HttpError(422, 'Role, action, and allowed boolean are required.');
  }

  if (role === 'admin') {
    throw new HttpError(403, 'Administrator permissions cannot be restricted (Guard Rail A6).');
  }

  // Risky grant validation: granting user.manage or marks.publish to student/parent requires a mandatory reason
  const isRisky =
    (role === 'student' || role === 'parent') &&
    ['user.manage', 'marks.publish', 'fee.record', 'settings.manage'].includes(action) &&
    allowed === true;

  if (isRisky && (!reason || reason.trim().length < 8)) {
    throw new HttpError(
      422,
      'Granting administrative/financial actions to student or parent roles requires a mandatory justification reason (min 8 characters).'
    );
  }

  await run(
    `INSERT INTO role_permission_overrides (role, action, allowed, reason, changed_by, changed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(role, action) DO UPDATE SET
       allowed = excluded.allowed,
       reason = excluded.reason,
       changed_by = excluded.changed_by,
       changed_at = datetime('now')`,
    [role, action, allowed ? 1 : 0, reason?.trim() || null, adminUser.id]
  );

  invalidatePermissionCache();
  await audit(adminUser.id, 'override_permission', 'role_permission_overrides', null, {
    role,
    action,
    allowed: Boolean(allowed),
    reason,
  });

  return json({ message: `Permission override for ${role}.${action} saved successfully.` });
});
