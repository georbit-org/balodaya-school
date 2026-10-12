import type { Role } from '@/lib/permissions';
import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles?: Role[];
  badgeKey?: 'applications' | 'leave' | 'messages' | 'notices';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROLE_NAV_GROUPS: Record<Role, NavGroup[]> = {
  student: [
    {
      label: 'Academics',
      items: [
        { label: 'My Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'My Profile', href: '/app/students/me', icon: 'students' },
        { label: 'My Attendance', href: '/app/attendance', icon: 'attendance' },
        { label: 'Apply for Leave', href: '/app/leave', icon: 'leave' },
        { label: 'Exam Results', href: '/app/exams', icon: 'exams' },
        { label: 'Class Timetable', href: '/app/timetable', icon: 'timetable' },
      ],
    },
    {
      label: 'Campus Life',
      items: [
        { label: 'Fee Invoices', href: '/app/fees', icon: 'fees' },
        { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
        { label: 'Library Catalog', href: '/app/library', icon: 'library' },
        { label: 'Study Resources', href: '/app/resources', icon: 'resources' },
        { label: 'House Points', href: '/app/houses', icon: 'houses' },
        { label: 'Bus Route', href: '/app/transport', icon: 'transport' },
      ],
    },
  ],

  parent: [
    {
      label: 'My Children',
      items: [
        { label: 'Parent Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'My Children', href: '/app/students', icon: 'students' },
        { label: 'Child Attendance', href: '/app/attendance', icon: 'attendance' },
        { label: 'Apply for Leave', href: '/app/leave', icon: 'leave' },
        { label: 'Exam Results', href: '/app/exams', icon: 'exams' },
        { label: 'Class Timetable', href: '/app/timetable', icon: 'timetable' },
      ],
    },
    {
      label: 'School & Billing',
      items: [
        { label: 'Fees & Receipts', href: '/app/fees', icon: 'fees' },
        { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
        { label: 'Bus Route', href: '/app/transport', icon: 'transport' },
      ],
    },
  ],

  teacher: [
    {
      label: 'Classroom',
      items: [
        { label: 'Teacher Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Take Attendance', href: '/app/attendance', icon: 'attendance' },
        { label: 'Leave Approvals', href: '/app/leave', icon: 'leave', badgeKey: 'leave' },
        { label: 'Enter Marks', href: '/app/exams', icon: 'exams' },
        { label: 'My Timetable', href: '/app/timetable', icon: 'timetable' },
        { label: 'My Section Students', href: '/app/students', icon: 'students' },
      ],
    },
    {
      label: 'Academics & Activities',
      items: [
        { label: 'School Notices', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
        { label: 'Study Resources', href: '/app/resources', icon: 'resources' },
        { label: 'Award House Points', href: '/app/houses', icon: 'houses' },
        { label: 'Library Issue/Return', href: '/app/library', icon: 'library' },
        { label: 'Class Reports', href: '/app/reports', icon: 'reports' },
      ],
    },
  ],

  accountant: [
    {
      label: 'Fee & Billing',
      items: [
        { label: 'Billing Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Fees & Invoices', href: '/app/fees', icon: 'fees' },
        { label: 'Payments & Receipts', href: '/app/payments', icon: 'receipt' },
        { label: 'Student Lookup', href: '/app/students', icon: 'students' },
        { label: 'Financial Reports', href: '/app/reports', icon: 'reports' },
      ],
    },
    {
      label: 'School Desk',
      items: [
        { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
      ],
    },
  ],

  principal: [
    {
      label: 'Administration',
      items: [
        { label: 'Principal Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Admissions Applications', href: '/app/applications', icon: 'applications', badgeKey: 'applications' },
        { label: 'Staff Directory', href: '/app/staff', icon: 'staff' },
        { label: 'Staff Attendance', href: '/app/staff/attendance', icon: 'clock' },
        { label: 'Students Directory', href: '/app/students', icon: 'students' },
        { label: 'Classes & Sections', href: '/app/classes', icon: 'classes' },
      ],
    },
    {
      label: 'Academic Supervision',
      items: [
        { label: 'Daily Attendance', href: '/app/attendance', icon: 'attendance' },
        { label: 'Leave Escalations', href: '/app/leave', icon: 'leave', badgeKey: 'leave' },
        { label: 'Exams & Results', href: '/app/exams', icon: 'exams' },
        { label: 'Master Timetable', href: '/app/timetable', icon: 'timetable' },
        { label: 'Fee Oversight', href: '/app/fees', icon: 'fees' },
        { label: 'School Reports', href: '/app/reports', icon: 'reports' },
      ],
    },
    {
      label: 'Operations & Logs',
      items: [
        { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
        { label: 'Library Catalog', href: '/app/library', icon: 'library' },
        { label: 'Transport Routes', href: '/app/transport', icon: 'transport' },
        { label: 'Houses & Points', href: '/app/houses', icon: 'houses' },
        { label: 'Media Library', href: '/app/media', icon: 'resources' },
        { label: 'Public Inquiries', href: '/app/messages', icon: 'messages', badgeKey: 'messages' },
        { label: 'School Calendar & Off Days', href: '/app/settings', icon: 'calendar' },
        { label: 'Audit Trail', href: '/app/settings/audit-log', icon: 'clock' },
      ],
    },
  ],

  admin: [
    {
      label: 'Overview & People',
      items: [
        { label: 'Admin Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Admissions Applications', href: '/app/applications', icon: 'applications', badgeKey: 'applications' },
        { label: 'Staff Directory', href: '/app/staff', icon: 'staff' },
        { label: 'Staff Attendance', href: '/app/staff/attendance', icon: 'clock' },
        { label: 'Students Directory', href: '/app/students', icon: 'students' },
        { label: 'User Logins', href: '/app/users', icon: 'users' },
        { label: 'Classes & Sections', href: '/app/classes', icon: 'classes' },
      ],
    },
    {
      label: 'Academics & Operations',
      items: [
        { label: 'Daily Attendance', href: '/app/attendance', icon: 'attendance' },
        { label: 'Leave Requests', href: '/app/leave', icon: 'leave', badgeKey: 'leave' },
        { label: 'Exams & Marks', href: '/app/exams', icon: 'exams' },
        { label: 'Class Timetable', href: '/app/timetable', icon: 'timetable' },
        { label: 'Fees & Invoices', href: '/app/fees', icon: 'fees' },
        { label: 'Payments & Receipts', href: '/app/payments', icon: 'receipt' },
        { label: 'Reports & Exports', href: '/app/reports', icon: 'reports' },
      ],
    },
    {
      label: 'Campus & Facilities',
      items: [
        { label: 'Notices & Circulars', href: '/app/notices', icon: 'notices', badgeKey: 'notices' },
        { label: 'Library Management', href: '/app/library', icon: 'library' },
        { label: 'Transport Routes', href: '/app/transport', icon: 'transport' },
        { label: 'Houses & Points', href: '/app/houses', icon: 'houses' },
        { label: 'Study Resources', href: '/app/resources', icon: 'resources' },
      ],
    },
    {
      label: 'Website & Total CMS',
      items: [
        { label: 'Site Pages & Sections', href: '/app/site/pages', icon: 'resources' },
        { label: 'Navigation Menus', href: '/app/site/menus', icon: 'resources' },
        { label: 'School Identity & Logo', href: '/app/site/identity', icon: 'settings' },
        { label: 'Visual Theme & Colors', href: '/app/site/theme', icon: 'settings' },
        { label: 'Media Library', href: '/app/media', icon: 'resources' },
        { label: 'Hero Slideshow', href: '/app/hero-slides', icon: 'slideshow' },
        { label: 'Careers & Vacancies', href: '/app/vacancies', icon: 'vacancies' },
        { label: 'Tenders & Bids', href: '/app/tenders', icon: 'tenders' },
        { label: 'Inquiries & Messages', href: '/app/messages', icon: 'messages', badgeKey: 'messages' },
      ],
    },
    {
      label: 'System Settings',
      items: [
        { label: 'Admin Control Center', href: '/app/settings', icon: 'settings' },
        { label: 'System Health Audit', href: '/app/settings/health', icon: 'settings' },
        { label: 'Setup Wizard', href: '/app/settings/wizard', icon: 'settings' },
        { label: 'Permissions Matrix', href: '/app/settings/permissions', icon: 'settings' },
        { label: 'Feature Modules', href: '/app/settings/modules', icon: 'settings' },
        { label: 'Vocabulary & Labels', href: '/app/settings/labels', icon: 'settings' },
        { label: 'Templates & Letters', href: '/app/settings/templates', icon: 'settings' },
        { label: 'Lookups & Custom Fields', href: '/app/settings/fields', icon: 'settings' },
        { label: 'Approval Workflows', href: '/app/settings/workflows', icon: 'settings' },
        { label: 'Data Vault & Backups', href: '/app/settings/data', icon: 'settings' },
        { label: 'Academic Years', href: '/app/settings/academic-year', icon: 'calendar' },
        { label: 'Grade Scale', href: '/app/settings/grade-scale', icon: 'settings' },
        { label: 'Audit Trail', href: '/app/settings/audit-log', icon: 'clock' },
      ],
    },
  ],
};

export function getNavGroupsForRole(role: Role): NavGroup[] {
  return ROLE_NAV_GROUPS[role] || ROLE_NAV_GROUPS.student;
}

// Fallback legacy export for backwards compatibility
export const NAV_GROUPS: NavGroup[] = ROLE_NAV_GROUPS.admin;

export interface SearchPage {
  title: string;
  href: string;
  roles: Role[];
  badge: string;
}

export const SEARCH_PAGES: SearchPage[] = [
  { title: 'Dashboard', href: '/app/dashboard', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'Overview' },
  { title: 'My Profile', href: '/app/students/me', roles: ['student'], badge: 'Profile' },
  { title: 'My Children', href: '/app/students', roles: ['parent'], badge: 'Family' },
  { title: 'Students Directory', href: '/app/students', roles: ['admin', 'principal', 'teacher', 'accountant'], badge: 'People' },
  { title: 'Admissions Applications', href: '/app/applications', roles: ['admin', 'principal'], badge: 'People' },
  { title: 'Staff Directory', href: '/app/staff', roles: ['admin', 'principal'], badge: 'People' },
  { title: 'Staff Attendance', href: '/app/staff/attendance', roles: ['admin', 'principal'], badge: 'People' },
  { title: 'User Accounts', href: '/app/users', roles: ['admin'], badge: 'People' },
  { title: 'Classes & Subjects', href: '/app/classes', roles: ['admin', 'principal'], badge: 'Academics' },
  { title: 'Daily Attendance', href: '/app/attendance', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
  { title: 'Leave Requests', href: '/app/leave', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
  { title: 'Exams & Marks', href: '/app/exams', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
  { title: 'Class Timetable', href: '/app/timetable', roles: ['admin', 'principal', 'teacher', 'student', 'parent'], badge: 'Academics' },
  { title: 'Fees & Invoices', href: '/app/fees', roles: ['admin', 'principal', 'accountant', 'parent', 'student'], badge: 'Finance' },
  { title: 'Payments & Receipts', href: '/app/payments', roles: ['admin', 'accountant'], badge: 'Finance' },
  { title: 'Notices & Circulars', href: '/app/notices', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'School' },
  { title: 'Library Catalog', href: '/app/library', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'School' },
  { title: 'Transport Routes', href: '/app/transport', roles: ['admin', 'principal', 'parent', 'student'], badge: 'School' },
  { title: 'Houses & Points', href: '/app/houses', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'School' },
  { title: 'Academic Resources', href: '/app/resources', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'School' },
  { title: 'Reports & Exports', href: '/app/reports', roles: ['admin', 'principal', 'teacher', 'accountant'], badge: 'Overview' },
  { title: 'Hero Slideshow', href: '/app/hero-slides', roles: ['admin', 'principal', 'teacher'], badge: 'Website' },
  { title: 'Media Library', href: '/app/media', roles: ['admin', 'principal'], badge: 'Website' },
  { title: 'Careers & Vacancies', href: '/app/vacancies', roles: ['admin', 'principal'], badge: 'Website' },
  { title: 'Tenders & Bids', href: '/app/tenders', roles: ['admin', 'principal'], badge: 'Website' },
  { title: 'Inquiries & Messages', href: '/app/messages', roles: ['admin', 'principal'], badge: 'Website' },
  { title: 'Academic Years', href: '/app/settings/academic-year', roles: ['admin'], badge: 'Settings' },
  { title: 'Grade Scale', href: '/app/settings/grade-scale', roles: ['admin'], badge: 'Settings' },
  { title: 'Audit Trail', href: '/app/settings/audit-log', roles: ['admin', 'principal'], badge: 'Settings' },
  { title: 'System Health Audit', href: '/app/settings/health', roles: ['admin'], badge: 'Settings' },
  { title: 'Setup Wizard', href: '/app/settings/wizard', roles: ['admin'], badge: 'Settings' },
  { title: 'Permissions Matrix', href: '/app/settings/permissions', roles: ['admin'], badge: 'Settings' },
  { title: 'Feature Modules', href: '/app/settings/modules', roles: ['admin'], badge: 'Settings' },
  { title: 'Vocabulary & Labels', href: '/app/settings/labels', roles: ['admin'], badge: 'Settings' },
  { title: 'Templates & Letters', href: '/app/settings/templates', roles: ['admin'], badge: 'Settings' },
  { title: 'Lookups & Fields', href: '/app/settings/fields', roles: ['admin'], badge: 'Settings' },
  { title: 'Approval Workflows', href: '/app/settings/workflows', roles: ['admin'], badge: 'Settings' },
  { title: 'Data Vault & Backups', href: '/app/settings/data', roles: ['admin'], badge: 'Settings' },
  { title: 'Visual Theme & Colors', href: '/app/site/theme', roles: ['admin'], badge: 'Website' },
  { title: 'Site Pages & Sections', href: '/app/site/pages', roles: ['admin', 'principal'], badge: 'Website' },
  { title: 'Navigation Menus', href: '/app/site/menus', roles: ['admin'], badge: 'Website' },
  { title: 'School Identity & Logo', href: '/app/site/identity', roles: ['admin'], badge: 'Website' },
  { title: 'Password & Security', href: '/app/account/password', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'Account' },
];
