CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','principal','teacher','accountant','parent','student')),
  password_hash TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS academic_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,            -- e.g. '2083'
  start_date TEXT,
  end_date TEXT,
  is_current INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,            -- 'Nursery','LKG','UKG','Class 1'..'Class 12'
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  name TEXT NOT NULL,                   -- 'A','B'
  class_teacher_id INTEGER REFERENCES users(id),
  UNIQUE (class_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  full_marks INTEGER NOT NULL DEFAULT 100,
  pass_marks INTEGER NOT NULL DEFAULT 40,
  UNIQUE (class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,            -- Red, Yellow, Blue, Green, Orange
  motto TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admission_no TEXT NOT NULL UNIQUE,    -- 'BAL-2083-0001'
  user_id INTEGER UNIQUE REFERENCES users(id),
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male','female','other')),
  dob TEXT,
  blood_group TEXT,
  address TEXT,
  house_id INTEGER REFERENCES houses(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','transferred','graduated','inactive')),
  admitted_on TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_guardians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  relation TEXT,
  phone TEXT,
  email TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
  section_id INTEGER NOT NULL REFERENCES sections(id),
  roll_no INTEGER,
  UNIQUE (student_id, academic_year_id),
  UNIQUE (section_id, academic_year_id, roll_no)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late','leave')),
  note TEXT,
  marked_by INTEGER REFERENCES users(id),
  UNIQUE (enrollment_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
  name TEXT NOT NULL,                   -- 'First Terminal'
  start_date TEXT,
  end_date TEXT,
  published INTEGER NOT NULL DEFAULT 0, -- results visible to parents/students
  public_results INTEGER NOT NULL DEFAULT 0 -- show on public Class X/XII page
);

CREATE TABLE IF NOT EXISTS exam_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  exam_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT
);

CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  marks REAL,                           -- NULL = absent / not entered
  entered_by INTEGER REFERENCES users(id),
  UNIQUE (exam_id, enrollment_id, subject_id)
);

CREATE TABLE IF NOT EXISTS grade_scale (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_percent REAL NOT NULL,
  grade TEXT NOT NULL,
  gpa REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_heads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE             -- 'Tuition','Admission','Transport','Exam'
);

CREATE TABLE IF NOT EXISTS fee_structure (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  fee_head_id INTEGER NOT NULL REFERENCES fee_heads(id),
  amount INTEGER NOT NULL,              -- whole NPR
  UNIQUE (class_id, fee_head_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,      -- 'INV-2083-00001'
  student_id INTEGER NOT NULL REFERENCES students(id),
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
  title TEXT NOT NULL,                  -- 'Baisakh 2083 fees'
  due_date TEXT,
  total INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no TEXT NOT NULL UNIQUE,      -- 'RCP-2083-00001'
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('cash','bank','esewa','khalti','other')),
  reference TEXT,
  paid_on TEXT NOT NULL,
  received_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timetable_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES sections(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),  -- 0=Sunday .. 5=Friday
  period INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  UNIQUE (section_id, day_of_week, period)
);

CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'notice' CHECK (kind IN ('notice','event')),
  audience TEXT NOT NULL DEFAULT 'public' CHECK (audience IN ('public','staff','parents','students')),
  event_date TEXT,
  attachment_path TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accession_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  copies INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS book_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES books(id),
  student_id INTEGER REFERENCES students(id),
  staff_id INTEGER REFERENCES users(id),
  issued_on TEXT NOT NULL,
  due_on TEXT NOT NULL,
  returned_on TEXT
);

CREATE TABLE IF NOT EXISTS transport_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  vehicle_no TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  monthly_fee INTEGER
);

CREATE TABLE IF NOT EXISTS transport_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pickup_time TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS student_transport (
  student_id INTEGER PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  route_id INTEGER NOT NULL REFERENCES transport_routes(id),
  stop_id INTEGER REFERENCES transport_stops(id)
);

CREATE TABLE IF NOT EXISTS house_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  points INTEGER NOT NULL,              -- may be negative
  reason TEXT NOT NULL,
  awarded_on TEXT NOT NULL,
  awarded_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS applications (        -- online admission applications
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,                -- 'APP-2083-00001'
  student_name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  class_applying TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  address TEXT,
  previous_school TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','accepted','rejected','enrolled')),
  student_id INTEGER REFERENCES students(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vacancies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('teaching','non-teaching')),
  description TEXT,
  deadline TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vacancy_id INTEGER REFERENCES vacancies(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  cv_path TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','shortlisted','rejected','hired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (            -- question bank, exam portions, etc.
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('question-bank','exam-portion','policy','other')),
  title TEXT NOT NULL,
  class_id INTEGER REFERENCES classes(id),
  subject_id INTEGER REFERENCES subjects(id),
  file_path TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  deadline TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (              -- contact form, TC requests, testimonials, alumni
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('contact','transfer-certificate','testimonial','alumni')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  extra TEXT,                                      -- JSON text for kind-specific fields
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','done','published','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image TEXT NOT NULL,
  primary_cta_text TEXT NOT NULL,
  primary_cta_link TEXT NOT NULL,
  secondary_cta_text TEXT NOT NULL,
  secondary_cta_link TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by INTEGER,
  reason TEXT,
  effective_from TEXT,
  changed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
  date TEXT NOT NULL,
  end_date TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('holiday','vacation','exam_day','event','half_day','working_override')),
  title TEXT NOT NULL,
  title_ne TEXT,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','students','staff')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id INTEGER NOT NULL REFERENCES attendance(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_note TEXT,
  new_note TEXT,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  changed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late','leave','half_day','on_duty')),
  check_in TEXT,
  check_out TEXT,
  note TEXT,
  marked_by INTEGER REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ne TEXT,
  audience TEXT CHECK (audience IN ('student','staff','both')),
  annual_quota REAL,
  requires_attachment_after_days INTEGER DEFAULT 2,
  paid INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  half_day INTEGER DEFAULT 0,
  working_days REAL NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','info_requested')),
  approver_id INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT,
  substitute_user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_leave_balances (
  user_id INTEGER NOT NULL REFERENCES users(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
  allocated REAL DEFAULT 0,
  used REAL DEFAULT 0,
  PRIMARY KEY (user_id, leave_type_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS leave_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_kind TEXT NOT NULL,
  request_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS approval_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applies_to TEXT NOT NULL,
  applicant_role TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id),
  step_no INTEGER NOT NULL,
  approver_kind TEXT NOT NULL CHECK (approver_kind IN ('class_teacher','role','user')),
  approver_value TEXT NOT NULL,
  escalate_after_hours INTEGER DEFAULT 48,
  can_skip_if_unavailable INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_exam ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_enroll_section ON enrollments(section_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON school_calendar(date);
CREATE INDEX IF NOT EXISTS idx_staff_att_date ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_leave_status ON staff_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_req_status ON leave_requests(status);

-- =========================================================================
-- TOTAL ADMIN CONTROL & CONTENT MANAGEMENT SYSTEM (CMS)
-- =========================================================================

CREATE TABLE IF NOT EXISTS media (
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
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_ne TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_image_media_id INTEGER REFERENCES media(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  show_in_nav INTEGER DEFAULT 0,
  nav_label TEXT,
  nav_label_ne TEXT,
  nav_order INTEGER DEFAULT 100,
  nav_parent_id INTEGER,
  is_system INTEGER DEFAULT 0,
  published_version_id INTEGER,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cms_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  schedule_from TEXT,
  schedule_to TEXT
);

CREATE TABLE IF NOT EXISTS cms_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  snapshot TEXT NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT NOT NULL CHECK (zone IN ('header','more','footer1','footer2','mobile')),
  label TEXT NOT NULL,
  label_ne TEXT,
  href TEXT NOT NULL,
  page_id INTEGER REFERENCES cms_pages(id),
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  open_new_tab INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  permanent INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS labels (
  key TEXT PRIMARY KEY,
  en TEXT NOT NULL,
  ne TEXT,
  group_name TEXT
);

CREATE TABLE IF NOT EXISTS templates (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  subject TEXT,
  body_en TEXT NOT NULL,
  body_ne TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lookups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  label_ne TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  UNIQUE(kind, code)
);

CREATE TABLE IF NOT EXISTS custom_fields (
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
);

CREATE TABLE IF NOT EXISTS custom_values (
  field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL,
  value TEXT,
  PRIMARY KEY (field_id, entity_id)
);

CREATE TABLE IF NOT EXISTS role_permission_overrides (
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed INTEGER NOT NULL,
  reason TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (role, action)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_media_visibility ON media(visibility);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_sections_page ON cms_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_site_menu_zone ON site_menu(zone, sort_order);


