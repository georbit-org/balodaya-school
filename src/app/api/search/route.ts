import { NextRequest } from 'next/server';
import { readSession } from '@/server/session';
import { query } from '@/server/db';
import { jsonOk, jsonUnauthorized } from '@/server/http';

interface SearchResultItem {
  id: string | number;
  title: string;
  subtitle?: string;
  href: string;
  category: 'pages' | 'students' | 'staff' | 'notices' | 'actions';
  badge?: string;
}

export async function GET(request: NextRequest) {
  const user = await readSession();
  if (!user) {
    return jsonUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    // Return default quick actions based on role
    const defaultActions: SearchResultItem[] = [];

    if (['admin', 'principal', 'teacher'].includes(user.role)) {
      defaultActions.push({
        id: 'act-att',
        title: 'Take Daily Attendance',
        subtitle: 'Record attendance for classes and sections',
        href: '/app/attendance',
        category: 'actions',
        badge: 'Academics',
      });
    }

    if (['admin', 'principal', 'accountant'].includes(user.role)) {
      defaultActions.push({
        id: 'act-fees',
        title: 'Fees & Invoices',
        subtitle: 'Manage fee structures and balances',
        href: '/app/fees',
        category: 'actions',
        badge: 'Finance',
      });
      defaultActions.push({
        id: 'act-payments',
        title: 'Record Payment & Receipt',
        subtitle: 'Issue official receipt for student fees',
        href: '/app/payments',
        category: 'actions',
        badge: 'Finance',
      });
    }

    if (['admin', 'principal'].includes(user.role)) {
      defaultActions.push({
        id: 'act-notice',
        title: 'Publish New Circular / Notice',
        subtitle: 'Send official school announcement',
        href: '/app/notices',
        category: 'actions',
        badge: 'Communication',
      });
      defaultActions.push({
        id: 'act-student',
        title: 'New Student Enrollment',
        subtitle: 'Admit student and register profile',
        href: '/app/students',
        category: 'actions',
        badge: 'Admissions',
      });
    }

    return jsonOk({ items: defaultActions });
  }

  const results: SearchResultItem[] = [];
  const term = `%${q}%`;

  // 1. SEARCH PAGES (Role-filtered)
  const ALL_PAGES: Array<{ title: string; href: string; roles: string[]; badge: string }> = [
    { title: 'Dashboard', href: '/app/dashboard', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'Overview' },
    { title: 'Reports & Exports', href: '/app/reports', roles: ['admin', 'principal', 'teacher', 'accountant'], badge: 'Overview' },
    { title: 'Students Directory', href: '/app/students', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'People' },
    { title: 'Admissions Applications', href: '/app/applications', roles: ['admin', 'principal'], badge: 'People' },
    { title: 'Staff Directory', href: '/app/staff', roles: ['admin', 'principal'], badge: 'People' },
    { title: 'User Accounts', href: '/app/users', roles: ['admin'], badge: 'People' },
    { title: 'Classes & Subjects', href: '/app/classes', roles: ['admin', 'principal'], badge: 'Academics' },
    { title: 'Daily Attendance', href: '/app/attendance', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
    { title: 'Leave Requests', href: '/app/leave', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
    { title: 'Exams & Marks', href: '/app/exams', roles: ['admin', 'principal', 'teacher', 'parent', 'student'], badge: 'Academics' },
    { title: 'Class Timetable', href: '/app/timetable', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'Academics' },
    { title: 'Fees & Invoices', href: '/app/fees', roles: ['admin', 'principal', 'accountant', 'parent', 'student'], badge: 'Finance' },
    { title: 'Payments & Receipts', href: '/app/payments', roles: ['admin', 'accountant'], badge: 'Finance' },
    { title: 'Notices & Circulars', href: '/app/notices', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'School' },
    { title: 'Library Catalog', href: '/app/library', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'School' },
    { title: 'Transport Routes', href: '/app/transport', roles: ['admin', 'principal', 'parent', 'student'], badge: 'School' },
    { title: 'Houses & Points', href: '/app/houses', roles: ['admin', 'principal', 'teacher', 'student'], badge: 'School' },
    { title: 'Hero Slideshow Management', href: '/app/hero-slides', roles: ['admin', 'principal', 'teacher'], badge: 'Website' },
    { title: 'Careers & Vacancies', href: '/app/vacancies', roles: ['admin', 'principal'], badge: 'Website' },
    { title: 'Tenders & Bids', href: '/app/tenders', roles: ['admin', 'principal'], badge: 'Website' },
    { title: 'Inquiries & Messages', href: '/app/messages', roles: ['admin', 'principal'], badge: 'Website' },
    { title: 'Academic Years', href: '/app/settings/academic-year', roles: ['admin'], badge: 'Settings' },
    { title: 'Grade Scale', href: '/app/settings/grade-scale', roles: ['admin'], badge: 'Settings' },
    { title: 'Password & Security', href: '/app/account/password', roles: ['admin', 'principal', 'teacher', 'accountant', 'parent', 'student'], badge: 'Account' },
  ];

  const matchedPages = ALL_PAGES.filter(
    (p) =>
      p.roles.includes(user.role) &&
      p.title.toLowerCase().includes(q.toLowerCase())
  );

  matchedPages.slice(0, 4).forEach((p) => {
    results.push({
      id: `page-${p.href}`,
      title: p.title,
      href: p.href,
      category: 'pages',
      badge: p.badge,
    });
  });

  // 2. SEARCH STUDENTS
  if (['admin', 'principal', 'teacher', 'accountant'].includes(user.role)) {
    try {
      const students = await query<{
        id: number;
        admission_no: string;
        full_name: string;
        class_name: string;
        section_name: string;
      }>(
        `SELECT s.id, s.admission_no, s.full_name, c.name as class_name, sec.name as section_name
         FROM students s
         LEFT JOIN enrollments e ON s.id = e.student_id
         LEFT JOIN sections sec ON e.section_id = sec.id
         LEFT JOIN classes c ON sec.class_id = c.id
         WHERE s.full_name LIKE ? OR s.admission_no LIKE ?
         LIMIT 6`,
        [term, term]
      );

      students.forEach((s) => {
        results.push({
          id: `student-${s.id}`,
          title: s.full_name,
          subtitle: `${s.admission_no} • ${s.class_name ? `${s.class_name} '${s.section_name}'` : 'Active'}`,
          href: `/app/students/${s.id}`,
          category: 'students',
          badge: 'Student',
        });
      });
    } catch (e) {
      console.error('Error searching students:', e);
    }
  }

  // 3. SEARCH STAFF
  if (['admin', 'principal', 'teacher'].includes(user.role)) {
    try {
      const staff = await query<{
        id: number;
        name: string;
        email: string;
        designation: string;
        role: string;
      }>(
        `SELECT id, name, email, designation, role FROM users
         WHERE (name LIKE ? OR email LIKE ? OR designation LIKE ?)
           AND role IN ('admin', 'principal', 'teacher', 'accountant')
         LIMIT 4`,
        [term, term, term]
      );

      staff.forEach((st) => {
        results.push({
          id: `staff-${st.id}`,
          title: st.name,
          subtitle: `${st.designation || st.role} • ${st.email}`,
          href: `/app/staff`,
          category: 'staff',
          badge: 'Staff',
        });
      });
    } catch (e) {
      console.error('Error searching staff:', e);
    }
  }

  // 4. SEARCH NOTICES
  try {
    const notices = await query<{ id: number; title: string; published_on: string }>(
      `SELECT id, title, published_on FROM notices
       WHERE title LIKE ? AND published = 1
       LIMIT 4`,
      [term]
    );

    notices.forEach((n) => {
      results.push({
        id: `notice-${n.id}`,
        title: n.title,
        subtitle: n.published_on ? `Published: ${n.published_on}` : undefined,
        href: `/app/notices`,
        category: 'notices',
        badge: 'Circular',
      });
    });
  } catch (e) {
    console.error('Error searching notices:', e);
  }

  return jsonOk({ items: results });
}
