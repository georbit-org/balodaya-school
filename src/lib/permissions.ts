export type Role = 'admin' | 'principal' | 'teacher' | 'accountant' | 'parent' | 'student';

export const ALL_ROLES: Role[] = ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'];

export type Action =
  | 'student.create'
  | 'student.edit'
  | 'student.view_all'
  | 'student.view_scope'
  | 'admission.manage'
  | 'staff.view'
  | 'staff.manage'
  | 'user.manage'
  | 'class.manage'
  | 'attendance.mark'
  | 'attendance.correct'
  | 'attendance.view_all'
  | 'leave.apply'
  | 'leave.review'
  | 'leave.cancel_own'
  | 'staff_leave.apply'
  | 'staff_leave.review'
  | 'staff_leave.view_all'
  | 'staff_attendance.mark'
  | 'staff_attendance.view'
  | 'exam.manage'
  | 'marks.enter'
  | 'marks.publish'
  | 'marks.override'
  | 'timetable.manage'
  | 'fee.generate'
  | 'fee.structure'
  | 'fee.waiver_approve'
  | 'fee.record'
  | 'fee.void'
  | 'report.all'
  | 'report.class'
  | 'report.finance'
  | 'notice.create_all'
  | 'notice.create_scope'
  | 'library.manage_books'
  | 'library.issue_return'
  | 'transport.manage'
  | 'house.manage'
  | 'house.award_points'
  | 'resource.manage'
  | 'cms.manage'
  | 'cms.edit'
  | 'cms.publish'
  | 'media.manage'
  | 'menu.manage'
  | 'theme.manage'
  | 'labels.manage'
  | 'templates.manage'
  | 'lookups.manage'
  | 'custom_fields.manage'
  | 'permissions.manage'
  | 'flags.manage'
  | 'backup.manage'
  | 'impersonate.view'
  | 'settings.manage'
  | 'audit.view';

export const PERMISSIONS: Record<Action, Role[]> = {
  'student.create': ['admin', 'principal'],
  'student.edit': ['admin', 'principal'],
  'student.view_all': ['admin', 'principal'],
  'student.view_scope': ['admin', 'principal', 'teacher', 'accountant'],
  'admission.manage': ['admin', 'principal'],
  'staff.view': ['admin', 'principal'],
  'staff.manage': ['admin', 'principal'],
  'user.manage': ['admin'],
  'class.manage': ['admin', 'principal'],
  'attendance.mark': ['admin', 'principal', 'teacher'],
  'attendance.correct': ['admin', 'principal'],
  'attendance.view_all': ['admin', 'principal'],
  'leave.apply': ['parent', 'student'],
  'leave.review': ['admin', 'principal', 'teacher'],
  'leave.cancel_own': ['parent', 'student'],
  'staff_leave.apply': ['teacher', 'accountant', 'principal'],
  'staff_leave.review': ['admin', 'principal'],
  'staff_leave.view_all': ['admin', 'principal'],
  'staff_attendance.mark': ['admin', 'principal'],
  'staff_attendance.view': ['admin', 'principal'],
  'exam.manage': ['admin', 'principal'],
  'marks.enter': ['admin', 'principal', 'teacher'],
  'marks.publish': ['admin', 'principal'],
  'marks.override': ['admin', 'principal'],
  'timetable.manage': ['admin', 'principal'],
  'fee.generate': ['admin', 'accountant'],
  'fee.structure': ['admin', 'accountant'],
  'fee.waiver_approve': ['admin', 'principal'],
  'fee.record': ['admin', 'accountant'],
  'fee.void': ['admin', 'principal'],
  'report.all': ['admin', 'principal'],
  'report.class': ['admin', 'principal', 'teacher'],
  'report.finance': ['admin', 'principal', 'accountant'],
  'notice.create_all': ['admin', 'principal'],
  'notice.create_scope': ['admin', 'principal', 'teacher', 'accountant'],
  'library.manage_books': ['admin', 'principal'],
  'library.issue_return': ['admin', 'principal', 'teacher'],
  'transport.manage': ['admin', 'principal'],
  'house.manage': ['admin', 'principal'],
  'house.award_points': ['admin', 'principal', 'teacher'],
  'resource.manage': ['admin', 'principal', 'teacher'],
  'cms.manage': ['admin', 'principal'],
  'cms.edit': ['admin', 'principal'],
  'cms.publish': ['admin'],
  'media.manage': ['admin', 'principal'],
  'menu.manage': ['admin'],
  'theme.manage': ['admin'],
  'labels.manage': ['admin'],
  'templates.manage': ['admin'],
  'lookups.manage': ['admin'],
  'custom_fields.manage': ['admin'],
  'permissions.manage': ['admin'],
  'flags.manage': ['admin'],
  'backup.manage': ['admin'],
  'impersonate.view': ['admin'],
  'settings.manage': ['admin'],
  'audit.view': ['admin', 'principal'],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(role);
}
