export interface NavLink {
  label: string;
  href: string;
}

export const MAIN_NAV: NavLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Student Life', href: '/student-life' },
  { label: 'News', href: '/news' },
];

export const MORE_NAV: NavLink[] = [
  { label: 'Facilities', href: '/facilities' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Exam Results', href: '/students/results' },
  { label: 'Academic Resources', href: '/students/resources' },
  { label: 'Exam Timetable', href: '/students/exam-timetable' },
  { label: 'Transfer Certificate', href: '/students/transfer-certificate' },
  { label: 'Alumni', href: '/students/alumni' },
  { label: 'Testimonials', href: '/students/testimonials' },
  { label: 'Tenders', href: '/tenders' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];
