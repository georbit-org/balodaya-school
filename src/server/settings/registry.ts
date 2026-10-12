export interface SettingDefinition {
  key: string;
  group:
    | 'calendar'
    | 'attendance'
    | 'leave'
    | 'school_identity'
    | 'academics'
    | 'fees'
    | 'notifications'
    | 'security';
  label: string;
  labelNe?: string;
  help: string;
  type: 'text' | 'number' | 'boolean' | 'time' | 'json';
  defaultValue: string;
  dangerous?: boolean;
}

export const SETTINGS_REGISTRY: Record<string, SettingDefinition> = {
  // Calendar & Working Week
  'weekly_off_days': {
    key: 'weekly_off_days',
    group: 'calendar',
    label: 'Weekly Off Days',
    labelNe: 'साप्ताहिक बिदा',
    help: 'Day(s) of the week when school is closed (0=Sunday, 6=Saturday). Default in Nepal is Saturday [6]. Admin can customize to Sunday [0] or both.',
    type: 'json',
    defaultValue: '[6]',
  },
  'school_start_time': {
    key: 'school_start_time',
    group: 'calendar',
    label: 'School Assembly / Start Time',
    labelNe: 'विद्यालय सुरु हुने समय',
    help: 'Official morning reporting and assembly time (NPT).',
    type: 'time',
    defaultValue: '09:00',
  },
  'school_end_time': {
    key: 'school_end_time',
    group: 'calendar',
    label: 'School Dismissal Time',
    labelNe: 'विद्यालय छुट्टी हुने समय',
    help: 'Official evening dismissal time.',
    type: 'time',
    defaultValue: '16:30',
  },

  // Attendance Rules
  'attendance_edit_window_days': {
    key: 'attendance_edit_window_days',
    group: 'attendance',
    label: 'Teacher Attendance Edit Window (Days)',
    labelNe: 'हाजिरी संशोधन गर्न पाउने दिन',
    help: 'Number of past days a class teacher can edit attendance. Older edits require principal/admin correction with mandatory reason.',
    type: 'number',
    defaultValue: '2',
  },
  'late_after_time': {
    key: 'late_after_time',
    group: 'attendance',
    label: 'Mark as Late After',
    labelNe: 'ढिलो मानिने समय',
    help: 'Time after which arriving students or staff are marked as Late.',
    type: 'time',
    defaultValue: '09:15',
  },
  'low_attendance_threshold': {
    key: 'low_attendance_threshold',
    group: 'attendance',
    label: 'Low Attendance Warning Threshold (%)',
    labelNe: 'न्यूनतम हाजिरी प्रतिशत',
    help: 'Percentage below which students appear on defaulter/warning rosters for examinations.',
    type: 'number',
    defaultValue: '75',
  },
  'consecutive_absence_alert_days': {
    key: 'consecutive_absence_alert_days',
    group: 'attendance',
    label: 'Consecutive Absence Alert (Days)',
    labelNe: 'लगातार अनुपस्थित चेतावनी दिन',
    help: 'Number of consecutive absent days triggering priority notification to class teacher and parents.',
    type: 'number',
    defaultValue: '3',
  },

  // Leave Policy
  'max_student_leave_days_teacher': {
    key: 'max_student_leave_days_teacher',
    group: 'leave',
    label: 'Max Student Leave Days by Class Teacher',
    labelNe: 'कक्षा शिक्षकले स्वीकृत गर्न सक्ने अधिकतम बिदा',
    help: 'Student leaves longer than this number of days automatically escalate to the Principal for decision.',
    type: 'number',
    defaultValue: '3',
  },
  'require_medical_attachment_days': {
    key: 'require_medical_attachment_days',
    group: 'leave',
    label: 'Medical Certificate Required After (Days)',
    labelNe: 'चिकित्सकीय सिफारिस आवश्यक पर्ने दिन',
    help: 'Sick leaves exceeding this duration require a medical document attachment.',
    type: 'number',
    defaultValue: '2',
  },

  // School Identity
  'school_name': {
    key: 'school_name',
    group: 'school_identity',
    label: 'School Name (English)',
    labelNe: 'विद्यालयको नाम (अंग्रेजी)',
    help: 'Official registered name displayed on marksheets, receipts, and web headers.',
    type: 'text',
    defaultValue: 'Balodaya Secondary English Boarding School',
  },
  'school_name_ne': {
    key: 'school_name_ne',
    group: 'school_identity',
    label: 'School Name (Nepali)',
    labelNe: 'विद्यालयको नाम (नेपाली)',
    help: 'Official Nepali name.',
    type: 'text',
    defaultValue: 'बालोदय माध्यमिक अंग्रेजी आवासीय विद्यालय',
  },
  'school_motto': {
    key: 'school_motto',
    group: 'school_identity',
    label: 'School Motto',
    labelNe: 'विद्यालयको आदर्श वाक्य',
    help: 'Official institutional motto.',
    type: 'text',
    defaultValue: 'The Need of Education, Civilization of the Nation',
  },
  'school_address': {
    key: 'school_address',
    group: 'school_identity',
    label: 'Campus Address',
    labelNe: 'ठेगाना',
    help: 'Physical location of campus.',
    type: 'text',
    defaultValue: 'Sundar Bazar, Bheerkot-06, Bayarghari, Syangja, Nepal',
  },
  'school_phone': {
    key: 'school_phone',
    group: 'school_identity',
    label: 'Official Contact Phone',
    labelNe: 'फोन नम्बर',
    help: 'Phone number for inquiries.',
    type: 'text',
    defaultValue: '+977-63-440123 / 9856012345',
  },
  'school_email': {
    key: 'school_email',
    group: 'school_identity',
    label: 'Official Email',
    labelNe: 'इमेल',
    help: 'Email address for communications.',
    type: 'text',
    defaultValue: 'info@balodaya.edu.np',
  },
  'principal_name': {
    key: 'principal_name',
    group: 'school_identity',
    label: 'Principal Name',
    labelNe: 'प्रधानाध्यापकको नाम',
    help: 'Name of the current Principal for certificates and official notices.',
    type: 'text',
    defaultValue: 'Amrit Aryal',
  },
  'established_year_bs': {
    key: 'established_year_bs',
    group: 'school_identity',
    label: 'Established Year (B.S.)',
    labelNe: 'स्थापना वर्ष',
    help: 'School establishment year.',
    type: 'text',
    defaultValue: '2063 B.S.',
  },
  'school_logo_media_id': {
    key: 'school_logo_media_id',
    group: 'school_identity',
    label: 'Official School Logo Media ID / Path',
    labelNe: 'लोगो',
    help: 'Official logo image path or media library ID.',
    type: 'text',
    defaultValue: '/assets/images/logo.png',
  },
  'office_hours_text': {
    key: 'office_hours_text',
    group: 'school_identity',
    label: 'Office Hours & Working Days Description',
    labelNe: 'कार्यालय समय',
    help: 'Displayed in public footer and contact section.',
    type: 'text',
    defaultValue: 'Sunday to Friday: 9:30 AM - 4:00 PM (Saturday Closed)',
  },
  'announcement_banner_active': {
    key: 'announcement_banner_active',
    group: 'school_identity',
    label: 'Top Announcement Banner Active',
    labelNe: 'सूचना पट्टी सक्रिय',
    help: 'Toggle site-wide announcement bar on public website.',
    type: 'boolean',
    defaultValue: 'true',
  },
  'announcement_banner_text': {
    key: 'announcement_banner_text',
    group: 'school_identity',
    label: 'Announcement Banner Text',
    labelNe: 'सूचना पट्टीको पाठ',
    help: 'Message displayed in the top header banner.',
    type: 'text',
    defaultValue: 'Admissions Open for Academic Year 2083/84 B.S. Enrollment interviews are currently underway.',
  },
  'announcement_banner_link': {
    key: 'announcement_banner_link',
    group: 'school_identity',
    label: 'Announcement Banner Link URL',
    labelNe: 'सूचना पट्टीको लिङ्क',
    help: 'Destination URL when visitor clicks the banner.',
    type: 'text',
    defaultValue: '/admissions',
  },
  'whatsapp_number': {
    key: 'whatsapp_number',
    group: 'school_identity',
    label: 'WhatsApp Quick-Chat Number',
    labelNe: 'ह्वाट्सएप नम्बर',
    help: 'Mobile number for instant WhatsApp chat button on mobile.',
    type: 'text',
    defaultValue: '9846043838',
  },
  'theme_primary_color': {
    key: 'theme_primary_color',
    group: 'school_identity',
    label: 'Primary Brand Color (Sky/Blue)',
    labelNe: 'मुख्य रङ',
    help: 'Hex code for primary buttons, highlights and header accents.',
    type: 'text',
    defaultValue: '#0284c7',
  },
  'theme_accent_color': {
    key: 'theme_accent_color',
    group: 'school_identity',
    label: 'Accent Dark Color (Navy)',
    labelNe: 'गाढा रङ',
    help: 'Hex code for headings and dark backgrounds.',
    type: 'text',
    defaultValue: '#0a2540',
  },
};
