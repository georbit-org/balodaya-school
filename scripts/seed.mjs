import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Load .env.local if present
try {
  process.loadEnvFile('.env.local');
} catch {
  // If loadEnvFile fails, rely on process.env
}

const dbUrl = process.env.DATABASE_URL ?? 'file:data/balodaya.db';

// Ensure data directory exists
if (dbUrl.startsWith('file:')) {
  const filePath = dbUrl.replace(/^file:/, '');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const client = createClient({ url: dbUrl });

async function seed() {
  console.log('========================================================');
  console.log('BALODAYA SECONDARY ENGLISH BOARDING SCHOOL');
  console.log('Seeding Comprehensive Demo Data for SMS & Portals');
  console.log('Target Database:', dbUrl);
  console.log('========================================================\n');

  // 1. Ensure Schema
  const schemaPath = path.join(process.cwd(), 'src', 'server', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Disable FK constraints during bulk reload
  await client.execute('PRAGMA foreign_keys = OFF');

  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log('✓ Database schema verified.');

  // Precompute Passwords
  const adminPasswordHash = bcrypt.hashSync('AdminBalodaya2063!', 10);
  const portalPasswordHash = bcrypt.hashSync('Balodaya2063!', 10);

  // 2. Academic Years
  await client.execute(`INSERT OR REPLACE INTO academic_years (id, name, start_date, end_date, is_current) VALUES
    (1, '2083', '2026-04-14', '2027-04-13', 1),
    (2, '2082', '2025-04-14', '2026-04-13', 0)`);
  console.log('✓ Academic years seeded (2083 Current, 2082 Previous).');

  // 3. Collegiate Houses
  const houses = [
    { id: 1, name: 'Red', motto: 'Igniting Passion, Fostering Unity, and Achieving Excellence!' },
    { id: 2, name: 'Yellow', motto: 'Radiant Minds, Unified Hearts, Limitless Horizons!' },
    { id: 3, name: 'Blue', motto: 'Soaring Beyond Boundaries, Uniting in Excellence!' },
    { id: 4, name: 'Green', motto: 'Growing Together, Sowing Seeds of Success' },
    { id: 5, name: 'Orange', motto: 'Blaze of Brilliance, Uniting in Triumph!' },
  ];
  for (const h of houses) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO houses (id, name, motto) VALUES (?, ?, ?)',
      args: [h.id, h.name, h.motto],
    });
  }
  console.log('✓ 5 Collegiate Houses seeded.');

  // 4. Classes (Nursery to Class 12)
  const classes = [
    { id: 1, name: 'Nursery', sort: 1 },
    { id: 2, name: 'LKG', sort: 2 },
    { id: 3, name: 'UKG', sort: 3 },
    { id: 4, name: 'Class 1', sort: 4 },
    { id: 5, name: 'Class 2', sort: 5 },
    { id: 6, name: 'Class 3', sort: 6 },
    { id: 7, name: 'Class 4', sort: 7 },
    { id: 8, name: 'Class 5', sort: 8 },
    { id: 9, name: 'Class 6', sort: 9 },
    { id: 10, name: 'Class 7', sort: 10 },
    { id: 11, name: 'Class 8', sort: 11 },
    { id: 12, name: 'Class 9', sort: 12 },
    { id: 13, name: 'Class 10', sort: 13 },
    { id: 14, name: 'Class 11', sort: 14 },
    { id: 15, name: 'Class 12', sort: 15 },
  ];
  for (const c of classes) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO classes (id, name, sort_order) VALUES (?, ?, ?)',
      args: [c.id, c.name, c.sort],
    });
  }
  console.log('✓ 15 Classes seeded.');

  // 5. Users (Staff, Teachers, Parents, Students)
  // Clean users table to avoid foreign key or ID mismatches, preserving standard IDs
  await client.execute('DELETE FROM users');
  const demoUsers = [
    {
      id: 1,
      email: 'admin@balodaya.edu.np',
      name: 'System Administrator',
      phone: '9856012345',
      designation: 'System Administrator & IT Head',
      role: 'admin',
      password_hash: adminPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 2,
      email: 'bishnu.pokharel@balodaya.edu.np',
      name: 'Bishnu Prasad Pokharel',
      phone: '9846012345',
      designation: 'Head of Mathematics & Science Department',
      role: 'teacher',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 3,
      email: 'aarav.sharma@balodaya.edu.np',
      name: 'Aarav Sharma',
      phone: '9846054320',
      designation: 'Student (Class 9-A, Blue House Captain)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 4,
      email: 'sita.sharma@balodaya.edu.np',
      name: 'Sita Sharma',
      phone: '9846054321',
      designation: 'Parent / Guardian',
      role: 'parent',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 5,
      email: 'accountant@balodaya.edu.np',
      name: 'Narayan Prasad Shrestha',
      phone: '9846067890',
      designation: 'Chief Bursar & Senior Accountant',
      role: 'accountant',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 6,
      email: 'principal@balodaya.edu.np',
      name: 'Tanka Prasad Sharma',
      phone: '9856023456',
      designation: 'Principal & Academic Director',
      role: 'principal',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 7,
      email: 'sarita.adhikari@balodaya.edu.np',
      name: 'Sarita Adhikari',
      phone: '9846023456',
      designation: 'Senior English Language & Literature Faculty',
      role: 'teacher',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 8,
      email: 'kiran.shrestha@balodaya.edu.np',
      name: 'Kiran Shrestha',
      phone: '9846034567',
      designation: 'Head of ICT & Computer Science Laboratory',
      role: 'teacher',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 9,
      email: 'maya.gurung@balodaya.edu.np',
      name: 'Maya Gurung',
      phone: '9846045678',
      designation: 'Senior Faculty - Nepali & Social Studies',
      role: 'teacher',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 10,
      email: 'dipak.rana@balodaya.edu.np',
      name: 'Dipak Rana',
      phone: '9846056789',
      designation: 'Director of Physical Education & Athletics',
      role: 'teacher',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 11,
      email: 'bikash.thapa@balodaya.edu.np',
      name: 'Bikash Thapa',
      phone: '9846078902',
      designation: 'Student (Class 9-A)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 12,
      email: 'chandra.gurung@balodaya.edu.np',
      name: 'Chandra Gurung',
      phone: '9846089013',
      designation: 'Student (Class 9-A)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 13,
      email: 'pooja.adhikari@balodaya.edu.np',
      name: 'Pooja Adhikari',
      phone: '9846090124',
      designation: 'Student (Class 10-A, Head Girl)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 14,
      email: 'rohan.shrestha@balodaya.edu.np',
      name: 'Rohan Shrestha',
      phone: '9846091235',
      designation: 'Student (Class 10-A, Head Boy)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 15,
      email: 'ananya.sharma@balodaya.edu.np',
      name: 'Ananya Sharma',
      phone: '9846054322',
      designation: 'Student (Class 6-A)',
      role: 'student',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
    {
      id: 16,
      email: 'ramesh.thapa@balodaya.edu.np',
      name: 'Ramesh Thapa',
      phone: '9846078901',
      designation: 'Parent / Guardian',
      role: 'parent',
      password_hash: portalPasswordHash,
      must_change_password: 0,
      active: 1,
    },
  ];

  for (const u of demoUsers) {
    await client.execute({
      sql: `INSERT INTO users (id, email, name, phone, designation, role, password_hash, must_change_password, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        u.id,
        u.email,
        u.name,
        u.phone,
        u.designation,
        u.role,
        u.password_hash,
        u.must_change_password,
        u.active,
      ],
    });
  }
  console.log(`✓ Seeded ${demoUsers.length} Users across Admin, Principal, Teachers, Accountant, Parents, Students.`);

  // 6. Sections
  await client.execute('DELETE FROM sections');
  const sections = [
    { id: 1, class_id: 12, name: 'A', class_teacher_id: 2 }, // Class 9-A (Teacher: Bishnu Pokharel)
    { id: 2, class_id: 13, name: 'A', class_teacher_id: 7 }, // Class 10-A (Teacher: Sarita Adhikari)
    { id: 3, class_id: 12, name: 'B', class_teacher_id: 8 }, // Class 9-B (Teacher: Kiran Shrestha)
    { id: 4, class_id: 13, name: 'B', class_teacher_id: 9 }, // Class 10-B (Teacher: Maya Gurung)
    { id: 5, class_id: 11, name: 'A', class_teacher_id: 9 }, // Class 8-A
    { id: 6, class_id: 10, name: 'A', class_teacher_id: 10 }, // Class 7-A
    { id: 7, class_id: 9, name: 'A', class_teacher_id: 2 },  // Class 6-A
    { id: 8, class_id: 8, name: 'A', class_teacher_id: 7 },  // Class 5-A
    { id: 9, class_id: 7, name: 'A', class_teacher_id: 8 },  // Class 4-A
    { id: 10, class_id: 6, name: 'A', class_teacher_id: 9 }, // Class 3-A
    { id: 11, class_id: 5, name: 'A', class_teacher_id: 10 },// Class 2-A
    { id: 12, class_id: 4, name: 'A', class_teacher_id: 2 }, // Class 1-A
    { id: 13, class_id: 3, name: 'A', class_teacher_id: 7 }, // UKG-A
    { id: 14, class_id: 2, name: 'A', class_teacher_id: 8 }, // LKG-A
    { id: 15, class_id: 1, name: 'A', class_teacher_id: 9 }, // Nursery-A
  ];
  for (const s of sections) {
    await client.execute({
      sql: 'INSERT INTO sections (id, class_id, name, class_teacher_id) VALUES (?, ?, ?, ?)',
      args: [s.id, s.class_id, s.name, s.class_teacher_id],
    });
  }
  console.log(`✓ Seeded ${sections.length} Sections with designated class teachers.`);

  // 7. Subjects
  await client.execute('DELETE FROM subjects');
  const subjects = [
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Compulsory English' },
    { id: 3, name: 'Compulsory Nepali' },
    { id: 4, name: 'Science & Technology' },
    { id: 5, name: 'Social Studies & Life Skills' },
    { id: 6, name: 'Computer Science & ICT' },
    { id: 7, name: 'Health, Physical & Moral Education' },
    { id: 8, name: 'Optional Mathematics' },
    { id: 9, name: 'Accountancy & Office Management' },
  ];
  for (const sub of subjects) {
    await client.execute({
      sql: 'INSERT INTO subjects (id, name) VALUES (?, ?)',
      args: [sub.id, sub.name],
    });
  }
  console.log(`✓ Seeded ${subjects.length} Academic Subjects.`);

  // 8. Class Subjects Assignment
  await client.execute('DELETE FROM class_subjects');
  const classSubAssignments = [
    // Class 9 (id: 12)
    { class_id: 12, subject_id: 1, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 2, teacher_id: 7, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 3, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 4, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 5, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 6, teacher_id: 8, full_marks: 100, pass_marks: 40 },
    { class_id: 12, subject_id: 8, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    // Class 10 (id: 13)
    { class_id: 13, subject_id: 1, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 2, teacher_id: 7, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 3, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 4, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 5, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 6, teacher_id: 8, full_marks: 100, pass_marks: 40 },
    { class_id: 13, subject_id: 8, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    // Class 8 (id: 11)
    { class_id: 11, subject_id: 1, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 11, subject_id: 2, teacher_id: 7, full_marks: 100, pass_marks: 40 },
    { class_id: 11, subject_id: 3, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 11, subject_id: 4, teacher_id: 2, full_marks: 100, pass_marks: 40 },
    { class_id: 11, subject_id: 5, teacher_id: 9, full_marks: 100, pass_marks: 40 },
    { class_id: 11, subject_id: 6, teacher_id: 8, full_marks: 100, pass_marks: 40 },
  ];
  for (const cs of classSubAssignments) {
    await client.execute({
      sql: `INSERT INTO class_subjects (class_id, subject_id, teacher_id, full_marks, pass_marks)
            VALUES (?, ?, ?, ?, ?)`,
      args: [cs.class_id, cs.subject_id, cs.teacher_id, cs.full_marks, cs.pass_marks],
    });
  }
  console.log(`✓ Seeded ${classSubAssignments.length} Class-Subject curriculum assignments.`);

  // 9. Students Roster
  await client.execute('DELETE FROM students');
  const students = [
    { id: 1, admission_no: 'BAL-2083-0001', user_id: 3, full_name: 'Aarav Sharma', gender: 'male', dob: '2068-05-15', blood_group: 'B+', address: 'Sundar Bazar, Ward 6, Syangja', house_id: 3, status: 'active', admitted_on: '2026-04-15' },
    { id: 2, admission_no: 'BAL-2083-0002', user_id: 11, full_name: 'Bikash Thapa', gender: 'male', dob: '2068-05-10', blood_group: 'A+', address: 'Bayarghari Chowk, Bheerkot-06', house_id: 1, status: 'active', admitted_on: '2026-04-15' },
    { id: 3, admission_no: 'BAL-2083-0003', user_id: 12, full_name: 'Chandra Gurung', gender: 'male', dob: '2068-08-15', blood_group: 'O+', address: 'Bheerkot-06, Syangja', house_id: 2, status: 'active', admitted_on: '2026-04-15' },
    { id: 4, admission_no: 'BAL-2083-0004', user_id: 13, full_name: 'Pooja Adhikari', gender: 'female', dob: '2067-03-12', blood_group: 'AB+', address: 'Waling-08, Syangja', house_id: 4, status: 'active', admitted_on: '2025-04-15' },
    { id: 5, admission_no: 'BAL-2083-0005', user_id: 14, full_name: 'Rohan Shrestha', gender: 'male', dob: '2067-07-22', blood_group: 'O+', address: 'Galyang-03, Syangja', house_id: 5, status: 'active', admitted_on: '2025-04-15' },
    { id: 6, admission_no: 'BAL-2083-0006', user_id: 15, full_name: 'Ananya Sharma', gender: 'female', dob: '2071-11-04', blood_group: 'B+', address: 'Sundar Bazar, Ward 6, Syangja', house_id: 3, status: 'active', admitted_on: '2026-04-15' },
    { id: 7, admission_no: 'BAL-2083-0007', user_id: null, full_name: 'Dipesh Magar', gender: 'male', dob: '2068-02-18', blood_group: 'A+', address: 'Bayarghari East, Syangja', house_id: 1, status: 'active', admitted_on: '2026-04-15' },
    { id: 8, admission_no: 'BAL-2083-0008', user_id: null, full_name: 'Kritika Pandey', gender: 'female', dob: '2068-09-30', blood_group: 'B-', address: 'Sundar Bazar, Bheerkot-06', house_id: 4, status: 'active', admitted_on: '2026-04-15' },
    { id: 9, admission_no: 'BAL-2083-0009', user_id: null, full_name: 'Manish Ranabhat', gender: 'male', dob: '2068-12-14', blood_group: 'O+', address: 'Bheerkot-04, Syangja', house_id: 2, status: 'active', admitted_on: '2026-04-15' },
    { id: 10, admission_no: 'BAL-2083-0010', user_id: null, full_name: 'Sushmita Karki', gender: 'female', dob: '2068-04-05', blood_group: 'A+', address: 'Bayarghari Bazar, Syangja', house_id: 5, status: 'active', admitted_on: '2026-04-15' },
    { id: 11, admission_no: 'BAL-2083-0011', user_id: null, full_name: 'Sandesh Aryal', gender: 'male', dob: '2067-06-25', blood_group: 'B+', address: 'Waling-06, Syangja', house_id: 3, status: 'active', admitted_on: '2025-04-15' },
    { id: 12, admission_no: 'BAL-2083-0012', user_id: null, full_name: 'Sneha Neupane', gender: 'female', dob: '2067-10-18', blood_group: 'O-', address: 'Bheerkot-06, Syangja', house_id: 4, status: 'active', admitted_on: '2025-04-15' },
    { id: 13, admission_no: 'BAL-2083-0013', user_id: null, full_name: 'Pradeep Gautam', gender: 'male', dob: '2069-01-11', blood_group: 'A+', address: 'Sundar Bazar Gate', house_id: 1, status: 'active', admitted_on: '2026-04-15' },
    { id: 14, admission_no: 'BAL-2083-0014', user_id: null, full_name: 'Barsha Regmi', gender: 'female', dob: '2069-04-19', blood_group: 'B+', address: 'Bayarghari Ward 6', house_id: 2, status: 'active', admitted_on: '2026-04-15' },
    { id: 15, admission_no: 'BAL-2083-0015', user_id: null, full_name: 'Ayush Bhattarai', gender: 'male', dob: '2070-08-08', blood_group: 'AB+', address: 'Putalibazar, Syangja', house_id: 3, status: 'active', admitted_on: '2026-04-15' },
    { id: 16, admission_no: 'BAL-2083-0016', user_id: null, full_name: 'Diya Shrestha', gender: 'female', dob: '2071-03-15', blood_group: 'O+', address: 'Sundar Bazar Ward 6', house_id: 5, status: 'active', admitted_on: '2026-04-15' },
    { id: 17, admission_no: 'BAL-2083-0017', user_id: null, full_name: 'Nabin Tiwari', gender: 'male', dob: '2072-06-20', blood_group: 'A+', address: 'Bayarghari Highway', house_id: 1, status: 'active', admitted_on: '2026-04-15' },
    { id: 18, admission_no: 'BAL-2083-0018', user_id: null, full_name: 'Riya GC', gender: 'female', dob: '2073-09-10', blood_group: 'B+', address: 'Waling-04, Syangja', house_id: 2, status: 'active', admitted_on: '2026-04-15' },
    { id: 19, admission_no: 'BAL-2083-0019', user_id: null, full_name: 'Sujan Poudel', gender: 'male', dob: '2074-12-05', blood_group: 'O+', address: 'Bheerkot-06, Syangja', house_id: 4, status: 'active', admitted_on: '2026-04-15' },
    { id: 20, admission_no: 'BAL-2083-0020', user_id: null, full_name: 'Alisha Sen', gender: 'female', dob: '2075-04-14', blood_group: 'A+', address: 'Sundar Bazar Chowk', house_id: 3, status: 'active', admitted_on: '2026-04-15' },
  ];

  for (const st of students) {
    await client.execute({
      sql: `INSERT INTO students (id, admission_no, user_id, full_name, gender, dob, blood_group, address, house_id, status, admitted_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        st.id,
        st.admission_no,
        st.user_id,
        st.full_name,
        st.gender,
        st.dob,
        st.blood_group,
        st.address,
        st.house_id,
        st.status,
        st.admitted_on,
      ],
    });
  }
  console.log(`✓ Seeded ${students.length} Student records across foundational and secondary tiers.`);

  // 10. Student Guardians
  await client.execute('DELETE FROM student_guardians');
  const guardians = [
    { student_id: 1, user_id: 4, name: 'Sita Sharma', relation: 'Mother', phone: '9846054321', email: 'sita.sharma@balodaya.edu.np', is_primary: 1 },
    { student_id: 1, user_id: null, name: 'Khem Raj Sharma', relation: 'Father', phone: '9856054320', email: 'khem.sharma@example.com', is_primary: 0 },
    { student_id: 6, user_id: 4, name: 'Sita Sharma', relation: 'Mother', phone: '9846054321', email: 'sita.sharma@balodaya.edu.np', is_primary: 1 },
    { student_id: 2, user_id: 16, name: 'Ramesh Thapa', relation: 'Father', phone: '9846078901', email: 'ramesh.thapa@balodaya.edu.np', is_primary: 1 },
    { student_id: 3, user_id: null, name: 'Bina Gurung', relation: 'Mother', phone: '9846089012', email: 'bina.gurung@example.com', is_primary: 1 },
    { student_id: 4, user_id: null, name: 'Krishna Adhikari', relation: 'Father', phone: '9846090123', email: 'krishna.adhikari@example.com', is_primary: 1 },
    { student_id: 5, user_id: null, name: 'Mohan Shrestha', relation: 'Father', phone: '9846091234', email: 'mohan.shrestha@example.com', is_primary: 1 },
  ];
  for (const g of guardians) {
    await client.execute({
      sql: `INSERT INTO student_guardians (student_id, user_id, name, relation, phone, email, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [g.student_id, g.user_id, g.name, g.relation, g.phone, g.email, g.is_primary],
    });
  }
  console.log(`✓ Linked Student Guardians (including demo Parent user Sita Sharma to Aarav & Ananya).`);

  // 11. Enrollments (Academic Year 2083 = id 1)
  await client.execute('DELETE FROM enrollments');
  const enrollments = [
    // Section 1: Class 9-A (Exactly 3 students: Aarav=1, Bikash=2, Chandra=3 for smoke test assertions)
    { id: 1, student_id: 1, academic_year_id: 1, section_id: 1, roll_no: 1 },
    { id: 2, student_id: 2, academic_year_id: 1, section_id: 1, roll_no: 2 },
    { id: 3, student_id: 3, academic_year_id: 1, section_id: 1, roll_no: 3 },
    // Section 3: Class 9-B
    { id: 4, student_id: 7, academic_year_id: 1, section_id: 3, roll_no: 1 },
    { id: 5, student_id: 8, academic_year_id: 1, section_id: 3, roll_no: 2 },
    { id: 6, student_id: 9, academic_year_id: 1, section_id: 3, roll_no: 3 },
    { id: 7, student_id: 10, academic_year_id: 1, section_id: 3, roll_no: 4 },
    // Section 2: Class 10-A
    { id: 8, student_id: 4, academic_year_id: 1, section_id: 2, roll_no: 1 },
    { id: 9, student_id: 5, academic_year_id: 1, section_id: 2, roll_no: 2 },
    { id: 10, student_id: 11, academic_year_id: 1, section_id: 2, roll_no: 3 },
    { id: 11, student_id: 12, academic_year_id: 1, section_id: 2, roll_no: 4 },
    // Section 5: Class 8-A
    { id: 12, student_id: 13, academic_year_id: 1, section_id: 5, roll_no: 1 },
    { id: 13, student_id: 14, academic_year_id: 1, section_id: 5, roll_no: 2 },
    // Section 6: Class 7-A
    { id: 14, student_id: 15, academic_year_id: 1, section_id: 6, roll_no: 1 },
    // Section 7: Class 6-A
    { id: 15, student_id: 6, academic_year_id: 1, section_id: 7, roll_no: 1 },
    { id: 16, student_id: 16, academic_year_id: 1, section_id: 7, roll_no: 2 },
    // Section 8: Class 5-A
    { id: 17, student_id: 17, academic_year_id: 1, section_id: 8, roll_no: 1 },
    // Section 9: Class 4-A
    { id: 18, student_id: 18, academic_year_id: 1, section_id: 9, roll_no: 1 },
    // Section 10: Class 3-A
    { id: 19, student_id: 19, academic_year_id: 1, section_id: 10, roll_no: 1 },
    // Section 12: Class 1-A
    { id: 20, student_id: 20, academic_year_id: 1, section_id: 12, roll_no: 1 },
  ];

  for (const en of enrollments) {
    await client.execute({
      sql: `INSERT INTO enrollments (id, student_id, academic_year_id, section_id, roll_no)
            VALUES (?, ?, ?, ?, ?)`,
      args: [en.id, en.student_id, en.academic_year_id, en.section_id, en.roll_no],
    });
  }
  console.log(`✓ Seeded ${enrollments.length} Active Student Enrollments across sections.`);

  // 12. Attendance Records
  await client.execute('DELETE FROM attendance');
  const today = new Date().toISOString().split('T')[0];
  const pastDates = [
    today,
    '2026-10-11',
    '2026-10-09',
    '2026-10-08',
    '2026-10-07',
    '2026-10-06',
    '2026-10-05',
    '2026-10-04',
    '2026-10-02',
    '2026-10-01',
  ];

  let attCount = 0;
  for (const d of pastDates) {
    // Section 1 students (enrollments 1..7)
    for (let eId = 1; eId <= 7; eId++) {
      let status = 'present';
      if (eId === 2 && d === '2026-10-08') status = 'absent';
      if (eId === 3 && d === '2026-10-07') status = 'leave';
      if (eId === 5 && d === today) status = 'late';

      await client.execute({
        sql: `INSERT OR REPLACE INTO attendance (enrollment_id, date, status, marked_by)
              VALUES (?, ?, ?, 2)`,
        args: [eId, d, status],
      });
      attCount++;
    }

    // Section 2 students (enrollments 8..11)
    for (let eId = 8; eId <= 11; eId++) {
      let status = 'present';
      if (eId === 10 && d === today) status = 'absent';
      await client.execute({
        sql: `INSERT OR REPLACE INTO attendance (enrollment_id, date, status, marked_by)
              VALUES (?, ?, ?, 7)`,
        args: [eId, d, status],
      });
      attCount++;
    }

    // Section 7 (Class 6-A, enrollment 15 Ananya Sharma)
    await client.execute({
      sql: `INSERT OR REPLACE INTO attendance (enrollment_id, date, status, marked_by)
            VALUES (15, ?, 'present', 2)`,
      args: [d],
    });
    attCount++;
  }
  console.log(`✓ Seeded ${attCount} Daily Attendance entries across school days.`);

  // 13. Leave Requests
  await client.execute('DELETE FROM leave_requests');
  const leaveRequests = [
    {
      student_id: 1,
      from_date: '2026-10-15',
      to_date: '2026-10-17',
      reason: 'Family wedding ceremony and cultural pilgrimage in Pokhara',
      status: 'pending',
      requested_by: 4,
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
    },
    {
      student_id: 3,
      from_date: '2026-10-07',
      to_date: '2026-10-08',
      reason: 'Doctor appointment & viral fever recovery',
      status: 'approved',
      requested_by: 12,
      reviewed_by: 6,
      reviewed_at: '2026-10-07 10:30:00',
      review_note: 'Approved. Please rest well and catch up on science notes.',
    },
    {
      student_id: 5,
      from_date: '2026-09-22',
      to_date: '2026-09-24',
      reason: 'Participation in Gandaki Provincial Science Exhibition',
      status: 'approved',
      requested_by: 14,
      reviewed_by: 2,
      reviewed_at: '2026-09-21 14:00:00',
      review_note: 'Approved. Best wishes representing Balodaya School.',
    },
    {
      student_id: 2,
      from_date: '2026-10-01',
      to_date: '2026-10-02',
      reason: 'Personal family travel outside district',
      status: 'rejected',
      requested_by: 16,
      reviewed_by: 2,
      reviewed_at: '2026-10-01 09:15:00',
      review_note: 'Could not approve due to mandatory first terminal exam revision sessions.',
    },
  ];

  for (const lr of leaveRequests) {
    await client.execute({
      sql: `INSERT INTO leave_requests (student_id, from_date, to_date, reason, status, requested_by, reviewed_by, reviewed_at, review_note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        lr.student_id,
        lr.from_date,
        lr.to_date,
        lr.reason,
        lr.status,
        lr.requested_by,
        lr.reviewed_by,
        lr.reviewed_at,
        lr.review_note,
      ],
    });
  }
  console.log(`✓ Seeded ${leaveRequests.length} Student Leave Requests with active review statuses.`);

  // 14. Exams, Exam Schedule & Marks
  await client.execute('DELETE FROM exams');
  await client.execute('DELETE FROM exam_schedule');
  await client.execute('DELETE FROM marks');

  await client.execute(`INSERT INTO exams (id, academic_year_id, name, start_date, end_date, published, public_results) VALUES
    (1, 1, 'First Terminal Examination 2083', '2026-07-15', '2026-07-25', 1, 1),
    (2, 1, 'Second Terminal Examination 2083', '2026-10-20', '2026-10-30', 0, 0),
    (3, 1, 'SEE Pre-Board Examination 2083', '2026-12-15', '2026-12-25', 0, 0)`);

  const examSchedules = [
    { exam_id: 1, class_id: 12, subject_id: 1, exam_date: '2026-07-15', start_time: '10:00', end_time: '13:00' },
    { exam_id: 1, class_id: 12, subject_id: 2, exam_date: '2026-07-16', start_time: '10:00', end_time: '13:00' },
    { exam_id: 1, class_id: 12, subject_id: 3, exam_date: '2026-07-18', start_time: '10:00', end_time: '13:00' },
    { exam_id: 1, class_id: 12, subject_id: 4, exam_date: '2026-07-20', start_time: '10:00', end_time: '13:00' },
    { exam_id: 1, class_id: 12, subject_id: 5, exam_date: '2026-07-22', start_time: '10:00', end_time: '13:00' },
    { exam_id: 1, class_id: 12, subject_id: 6, exam_date: '2026-07-24', start_time: '10:00', end_time: '12:00' },
  ];
  for (const es of examSchedules) {
    await client.execute({
      sql: `INSERT INTO exam_schedule (exam_id, class_id, subject_id, exam_date, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [es.exam_id, es.class_id, es.subject_id, es.exam_date, es.start_time, es.end_time],
    });
  }

  // Marks for Exam 1 across Section 1 (Enrollments 1, 2, 3 required by smoke.mjs test)
  const marksEntries = [
    // Aarav Sharma (Enrollment 1) - High Achiever
    { exam_id: 1, enrollment_id: 1, subject_id: 1, marks: 92 },
    { exam_id: 1, enrollment_id: 1, subject_id: 2, marks: 88 },
    { exam_id: 1, enrollment_id: 1, subject_id: 3, marks: 85 },
    { exam_id: 1, enrollment_id: 1, subject_id: 4, marks: 95 },
    { exam_id: 1, enrollment_id: 1, subject_id: 5, marks: 89 },
    { exam_id: 1, enrollment_id: 1, subject_id: 6, marks: 98 },
    // Bikash Thapa (Enrollment 2) - Solid Performer
    { exam_id: 1, enrollment_id: 2, subject_id: 1, marks: 75 },
    { exam_id: 1, enrollment_id: 2, subject_id: 2, marks: 72 },
    { exam_id: 1, enrollment_id: 2, subject_id: 3, marks: 78 },
    { exam_id: 1, enrollment_id: 2, subject_id: 4, marks: 80 },
    { exam_id: 1, enrollment_id: 2, subject_id: 5, marks: 76 },
    { exam_id: 1, enrollment_id: 2, subject_id: 6, marks: 84 },
    // Chandra Gurung (Enrollment 3) - Passed
    { exam_id: 1, enrollment_id: 3, subject_id: 1, marks: 68 },
    { exam_id: 1, enrollment_id: 3, subject_id: 2, marks: 65 },
    { exam_id: 1, enrollment_id: 3, subject_id: 3, marks: 70 },
    { exam_id: 1, enrollment_id: 3, subject_id: 4, marks: 72 },
    { exam_id: 1, enrollment_id: 3, subject_id: 5, marks: 74 },
    { exam_id: 1, enrollment_id: 3, subject_id: 6, marks: 77 },
  ];

  for (const m of marksEntries) {
    await client.execute({
      sql: `INSERT INTO marks (exam_id, enrollment_id, subject_id, marks, entered_by)
            VALUES (?, ?, ?, ?, 2)`,
      args: [m.exam_id, m.enrollment_id, m.subject_id, m.marks],
    });
  }
  console.log(`✓ Seeded Exams, Schedules & Terminal Exam Marks.`);

  // 15. Fee Structure
  await client.execute('DELETE FROM fee_structure');
  const feeStructures = [
    // Class 10 (id: 13)
    { class_id: 13, fee_head_id: 1, amount: 2800 }, // Tuition
    { class_id: 13, fee_head_id: 2, amount: 3500 }, // Admission
    { class_id: 13, fee_head_id: 3, amount: 1500 }, // Transport
    { class_id: 13, fee_head_id: 4, amount: 800 },  // Exam
    // Class 9 (id: 12)
    { class_id: 12, fee_head_id: 1, amount: 2500 },
    { class_id: 12, fee_head_id: 2, amount: 3000 },
    { class_id: 12, fee_head_id: 3, amount: 1500 },
    { class_id: 12, fee_head_id: 4, amount: 700 },
    // Class 8 (id: 11)
    { class_id: 11, fee_head_id: 1, amount: 2200 },
    { class_id: 11, fee_head_id: 2, amount: 2500 },
    { class_id: 11, fee_head_id: 3, amount: 1500 },
    { class_id: 11, fee_head_id: 4, amount: 600 },
    // Class 6 (id: 9)
    { class_id: 9, fee_head_id: 1, amount: 1800 },
    { class_id: 9, fee_head_id: 2, amount: 2000 },
    { class_id: 9, fee_head_id: 3, amount: 1500 },
    { class_id: 9, fee_head_id: 4, amount: 500 },
    // Class 1 (id: 4)
    { class_id: 4, fee_head_id: 1, amount: 1400 },
    { class_id: 4, fee_head_id: 2, amount: 1500 },
    { class_id: 4, fee_head_id: 3, amount: 1500 },
    { class_id: 4, fee_head_id: 4, amount: 400 },
  ];
  for (const fs of feeStructures) {
    await client.execute({
      sql: `INSERT INTO fee_structure (class_id, fee_head_id, amount) VALUES (?, ?, ?)`,
      args: [fs.class_id, fs.fee_head_id, fs.amount],
    });
  }
  console.log(`✓ Seeded Class-wise Fee Structures.`);

  // 16. Invoices, Invoice Items & Payments
  await client.execute('DELETE FROM payments');
  await client.execute('DELETE FROM invoice_items');
  await client.execute('DELETE FROM invoices');

  const demoInvoices = [
    // Invoice 1: Aarav Sharma Baisakh Fees (Paid in full via eSewa)
    {
      id: 1,
      invoice_no: 'INV-2083-00001',
      student_id: 1,
      academic_year_id: 1,
      title: 'Baisakh 2083 Tuition & Terminal Exam Fee',
      due_date: '2026-05-10',
      total: 3200,
      created_by: 5,
      items: [
        { description: 'Monthly Tuition Fee - Baisakh', amount: 2500 },
        { description: 'Terminal Examination Fee', amount: 700 },
      ],
      payment: {
        id: 1,
        receipt_no: 'RCP-2083-00001',
        amount: 3200,
        method: 'esewa',
        reference: 'ESEWA-9846054321-0941',
        paid_on: '2026-05-02',
      },
    },
    // Invoice 2: Bikash Thapa Baisakh Fees (Paid in full via Cash)
    {
      id: 2,
      invoice_no: 'INV-2083-00002',
      student_id: 2,
      academic_year_id: 1,
      title: 'Baisakh 2083 Tuition Fee',
      due_date: '2026-05-10',
      total: 2500,
      created_by: 5,
      items: [{ description: 'Monthly Tuition Fee - Baisakh', amount: 2500 }],
      payment: {
        id: 2,
        receipt_no: 'RCP-2083-00002',
        amount: 2500,
        method: 'cash',
        reference: 'CASH-COUNTER-012',
        paid_on: '2026-05-05',
      },
    },
    // Invoice 3: Chandra Gurung Baisakh Fees (Paid in full via Bank)
    {
      id: 3,
      invoice_no: 'INV-2083-00003',
      student_id: 3,
      academic_year_id: 1,
      title: 'Baisakh 2083 Tuition Fee',
      due_date: '2026-05-10',
      total: 2500,
      created_by: 5,
      items: [{ description: 'Monthly Tuition Fee - Baisakh', amount: 2500 }],
      payment: {
        id: 3,
        receipt_no: 'RCP-2083-00003',
        amount: 2500,
        method: 'bank',
        reference: 'NABIL-TRX-882194',
        paid_on: '2026-05-06',
      },
    },
    // Invoice 4: Aarav Sharma Jestha & Ashadh Tuition (Paid)
    {
      id: 4,
      invoice_no: 'INV-2083-00004',
      student_id: 1,
      academic_year_id: 1,
      title: 'Jestha & Ashadh 2083 Tuition Fee',
      due_date: '2026-07-10',
      total: 5000,
      created_by: 5,
      items: [
        { description: 'Monthly Tuition Fee - Jestha', amount: 2500 },
        { description: 'Monthly Tuition Fee - Ashadh', amount: 2500 },
      ],
      payment: {
        id: 4,
        receipt_no: 'RCP-2083-00004',
        amount: 5000,
        method: 'khalti',
        reference: 'KHALTI-TXN-44102',
        paid_on: '2026-07-04',
      },
    },
    // Invoice 5: Aarav Sharma Ashwin 2083 Fees (Partial / Balance Due for Parent & Student Portal verification)
    {
      id: 5,
      invoice_no: 'INV-2083-00005',
      student_id: 1,
      academic_year_id: 1,
      title: 'Ashwin 2083 Tuition & Computer Lab Fee',
      due_date: '2026-10-30',
      total: 3000,
      created_by: 5,
      items: [
        { description: 'Monthly Tuition Fee - Ashwin', amount: 2500 },
        { description: 'ATAL Digicamp Practical Lab Fee', amount: 500 },
      ],
      payment: {
        id: 5,
        receipt_no: 'RCP-2083-00005',
        amount: 1500,
        method: 'esewa',
        reference: 'ESEWA-PARTIAL-1120',
        paid_on: today,
      },
    },
    // Invoice 6: Ananya Sharma (Student 6, Sita Sharma child) Ashwin Fees (Unpaid dues)
    {
      id: 6,
      invoice_no: 'INV-2083-00006',
      student_id: 6,
      academic_year_id: 1,
      title: 'Ashwin 2083 Tuition Fee',
      due_date: '2026-10-30',
      total: 1800,
      created_by: 5,
      items: [{ description: 'Monthly Tuition Fee - Ashwin', amount: 1800 }],
      payment: null, // Unpaid
    },
    // Invoice 7: Pooja Adhikari (Class 10) Tuition & SEE Coaching (Paid today)
    {
      id: 7,
      invoice_no: 'INV-2083-00007',
      student_id: 4,
      academic_year_id: 1,
      title: 'Ashwin 2083 Class 10 Tuition & SEE Mock Exam',
      due_date: '2026-10-25',
      total: 3600,
      created_by: 5,
      items: [
        { description: 'Class 10 Tuition Fee - Ashwin', amount: 2800 },
        { description: 'SEE Coaching & Mock Examination Series', amount: 800 },
      ],
      payment: {
        id: 6,
        receipt_no: 'RCP-2083-00006',
        amount: 3600,
        method: 'cash',
        reference: 'CASH-COUNTER-098',
        paid_on: today,
      },
    },
  ];

  for (const inv of demoInvoices) {
    await client.execute({
      sql: `INSERT INTO invoices (id, invoice_no, student_id, academic_year_id, title, due_date, total, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        inv.id,
        inv.invoice_no,
        inv.student_id,
        inv.academic_year_id,
        inv.title,
        inv.due_date,
        inv.total,
        inv.created_by,
      ],
    });

    for (const item of inv.items) {
      await client.execute({
        sql: `INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)`,
        args: [inv.id, item.description, item.amount],
      });
    }

    if (inv.payment) {
      await client.execute({
        sql: `INSERT INTO payments (id, receipt_no, invoice_id, amount, method, reference, paid_on, received_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          inv.payment.id,
          inv.payment.receipt_no,
          inv.id,
          inv.payment.amount,
          inv.payment.method,
          inv.payment.reference,
          inv.payment.paid_on,
          5,
        ],
      });
    }
  }
  console.log(`✓ Seeded Invoices, Line Items & Official Receipts (including paid & pending balances).`);

  // 17. Timetable Slots (Class 9-A = section 1, Class 10-A = section 2)
  await client.execute('DELETE FROM timetable_slots');
  const timetableSlots = [
    // Sunday (day 0) Section 1: Period 1 MUST BE teacher 2, period 1 on Sunday for smoke.mjs clash detection!
    { section_id: 1, day_of_week: 0, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 1, teacher_id: 2 }, // Math (Bishnu)
    { section_id: 1, day_of_week: 0, period: 2, start_time: '10:45', end_time: '11:30', subject_id: 4, teacher_id: 2 }, // Science (Bishnu)
    { section_id: 1, day_of_week: 0, period: 3, start_time: '11:30', end_time: '12:15', subject_id: 2, teacher_id: 7 }, // English (Sarita)
    { section_id: 1, day_of_week: 0, period: 4, start_time: '12:55', end_time: '01:35', subject_id: 3, teacher_id: 9 }, // Nepali (Maya)
    { section_id: 1, day_of_week: 0, period: 5, start_time: '01:35', end_time: '02:15', subject_id: 5, teacher_id: 9 }, // Social (Maya)
    { section_id: 1, day_of_week: 0, period: 6, start_time: '02:15', end_time: '02:55', subject_id: 6, teacher_id: 8 }, // Computer (Kiran)
    { section_id: 1, day_of_week: 0, period: 7, start_time: '02:55', end_time: '03:30', subject_id: 8, teacher_id: 2 }, // Opt Math

    // Monday (day 1) Section 1
    { section_id: 1, day_of_week: 1, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 2, teacher_id: 7 },
    { section_id: 1, day_of_week: 1, period: 2, start_time: '10:45', end_time: '11:30', subject_id: 1, teacher_id: 2 },
    { section_id: 1, day_of_week: 1, period: 3, start_time: '11:30', end_time: '12:15', subject_id: 4, teacher_id: 2 },
    { section_id: 1, day_of_week: 1, period: 4, start_time: '12:55', end_time: '01:35', subject_id: 6, teacher_id: 8 },
    { section_id: 1, day_of_week: 1, period: 5, start_time: '01:35', end_time: '02:15', subject_id: 3, teacher_id: 9 },
    { section_id: 1, day_of_week: 1, period: 6, start_time: '02:15', end_time: '02:55', subject_id: 5, teacher_id: 9 },

    // Tuesday to Friday Section 1
    { section_id: 1, day_of_week: 2, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 4, teacher_id: 2 },
    { section_id: 1, day_of_week: 2, period: 2, start_time: '10:45', end_time: '11:30', subject_id: 1, teacher_id: 2 },
    { section_id: 1, day_of_week: 3, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 1, teacher_id: 2 },
    { section_id: 1, day_of_week: 4, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 6, teacher_id: 8 },
    { section_id: 1, day_of_week: 5, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 2, teacher_id: 7 },

    // Section 2: Class 10-A Slots
    { section_id: 2, day_of_week: 0, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 2, teacher_id: 7 },
    { section_id: 2, day_of_week: 0, period: 2, start_time: '10:45', end_time: '11:30', subject_id: 1, teacher_id: 2 },
    { section_id: 2, day_of_week: 0, period: 3, start_time: '11:30', end_time: '12:15', subject_id: 4, teacher_id: 2 },
    { section_id: 2, day_of_week: 0, period: 4, start_time: '12:55', end_time: '01:35', subject_id: 6, teacher_id: 8 },
    { section_id: 2, day_of_week: 1, period: 1, start_time: '10:00', end_time: '10:45', subject_id: 1, teacher_id: 2 },
  ];

  for (const ts of timetableSlots) {
    await client.execute({
      sql: `INSERT INTO timetable_slots (section_id, day_of_week, period, start_time, end_time, subject_id, teacher_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ts.section_id,
        ts.day_of_week,
        ts.period,
        ts.start_time,
        ts.end_time,
        ts.subject_id,
        ts.teacher_id,
      ],
    });
  }
  console.log(`✓ Seeded Weekly Timetable schedule across classes.`);

  // 18. Notices & Circulars
  await client.execute('DELETE FROM notices');
  const notices = [
    {
      id: 1,
      title: 'Admissions Open for Academic Session 2083/84 (Playgroup to Grade 9)',
      body: 'Balodaya Secondary English Boarding School cordially announces online & on-campus admissions for the upcoming academic year. Early bird scholarship evaluation examinations are scheduled for every Saturday. Contact the administration desk or apply online.',
      kind: 'notice',
      audience: 'public',
      event_date: null,
      published: 1,
      created_by: 1,
    },
    {
      id: 2,
      title: 'Annual Inter-House Athletics & Sports Meet 2083',
      body: 'The annual inter-house sports meet featuring track & field, football, badminton, and chess competitions will take place on our school sports grounds. House jerseys and disciplined participation are mandatory.',
      kind: 'event',
      audience: 'public',
      event_date: '2026-11-15',
      published: 1,
      created_by: 10,
    },
    {
      id: 3,
      title: 'Dashain and Tihar Festival Vacation Schedule',
      body: 'Greetings to all students, parents, and guardians on the auspicious occasion of Vijaya Dashami and Deepawali 2083. School will remain closed from Ashwin 28 through Kartik 18. Classes resume on Kartik 19.',
      kind: 'notice',
      audience: 'public',
      event_date: null,
      published: 1,
      created_by: 6,
    },
    {
      id: 4,
      title: 'Mandatory Parent-Teacher Meeting (PTM) for Classes 8, 9, and 10',
      body: 'Terminal progress report distribution, attendance reviews, and SEE preparation strategy consultations with respective class teachers will be conducted from 11:00 AM to 3:00 PM.',
      kind: 'event',
      audience: 'parents',
      event_date: '2026-10-25',
      published: 1,
      created_by: 6,
    },
    {
      id: 5,
      title: 'Staff Academic Coordination & Question Moderation Session',
      body: 'All department heads and subject teachers are requested to attend the second terminal question moderation meeting in the conference hall at 3:45 PM.',
      kind: 'notice',
      audience: 'staff',
      event_date: '2026-10-18',
      published: 1,
      created_by: 6,
    },
    {
      id: 6,
      title: 'ATAL Digicamp ICT & Robotics Weekend Bootcamp',
      body: 'Hands-on practical workshop covering Python programming basics and STEM electronics in the digital computing laboratory for students of Class 8, 9, and 10.',
      kind: 'event',
      audience: 'students',
      event_date: '2026-10-22',
      published: 1,
      created_by: 8,
    },
  ];

  for (const n of notices) {
    await client.execute({
      sql: `INSERT INTO notices (id, title, body, kind, audience, event_date, published, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [n.id, n.title, n.body, n.kind, n.audience, n.event_date, n.published, n.created_by],
    });
  }
  console.log(`✓ Seeded ${notices.length} Official Bulletins, Events, and Targeted Circulars.`);

  // 19. Library Books & Loans
  await client.execute('DELETE FROM book_loans');
  await client.execute('DELETE FROM books');

  const books = [
    { id: 1, accession_no: 'ACC-SCI-0101', title: 'Principles of Physics Class 9 & 10', author: 'Nepal Curriculum Development Centre', category: 'Science', copies: 5 },
    { id: 2, accession_no: 'ACC-LIT-0202', title: 'Muna Madan', author: 'Mahakavi Laxmi Prasad Devkota', category: 'Nepali Literature', copies: 2 }, // 2 copies, loaned to 2 students to test overdraft logic
    { id: 3, accession_no: 'ACC-MTH-0303', title: 'Advanced Secondary Mathematics', author: 'Prof. S.K. Shrestha', category: 'Mathematics', copies: 4 },
    { id: 4, accession_no: 'ACC-SCI-0404', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science & Cosmology', copies: 3 },
    { id: 5, accession_no: 'ACC-FIC-0505', title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', category: 'English Fiction', copies: 3 },
    { id: 6, accession_no: 'ACC-LIT-0606', title: 'Palpasa Café', author: 'Narayan Wagle', category: 'Nepali Fiction', copies: 3 },
    { id: 7, accession_no: 'ACC-REF-0707', title: 'Oxford Advanced Learner\'s Dictionary 10th Edition', author: 'Oxford University Press', category: 'Reference', copies: 6 },
    { id: 8, accession_no: 'ACC-HIS-0808', title: 'Seto Bagh (The White Tiger)', author: 'Diamond Shumsher Rana', category: 'Historical Fiction', copies: 2 },
    { id: 9, accession_no: 'ACC-ICT-0909', title: 'Computer Science & Python Guide for High School', author: 'Er. Rabin Kandel', category: 'Computer Science', copies: 4 },
    { id: 10, accession_no: 'ACC-LIT-1010', title: 'Siris Ko Phool (The Blue Mimosa)', author: 'Parijat', category: 'Nepali Literature', copies: 3 },
  ];

  for (const b of books) {
    await client.execute({
      sql: `INSERT INTO books (id, accession_no, title, author, category, copies)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b.id, b.accession_no, b.title, b.author, b.category, b.copies],
    });
  }

  // Loans: Book 2 has 2 copies and 2 active loans -> exactly 0 available (matches smoke.mjs test!)
  const bookLoans = [
    { id: 1, book_id: 1, student_id: 1, staff_id: null, issued_on: '2026-10-01', due_on: '2026-10-15', returned_on: '2026-10-10' }, // Returned
    { id: 2, book_id: 2, student_id: 2, staff_id: null, issued_on: '2026-10-05', due_on: '2026-10-19', returned_on: null },        // Active loan 1
    { id: 3, book_id: 2, student_id: 3, staff_id: null, issued_on: '2026-10-06', due_on: '2026-10-20', returned_on: null },        // Active loan 2
    { id: 4, book_id: 3, student_id: 4, staff_id: null, issued_on: '2026-09-15', due_on: '2026-09-29', returned_on: null },        // Overdue loan!
    { id: 5, book_id: 5, student_id: 1, staff_id: null, issued_on: '2026-10-08', due_on: '2026-10-22', returned_on: null },        // Active loan for Aarav
    { id: 6, book_id: 9, student_id: null, staff_id: 2, issued_on: '2026-10-02', due_on: '2026-10-30', returned_on: null },        // Staff loan
  ];

  for (const bl of bookLoans) {
    await client.execute({
      sql: `INSERT INTO book_loans (id, book_id, student_id, staff_id, issued_on, due_on, returned_on)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [bl.id, bl.book_id, bl.student_id, bl.staff_id, bl.issued_on, bl.due_on, bl.returned_on],
    });
  }
  console.log(`✓ Seeded ${books.length} Library Catalog Books & Active/Overdue Circulation Loans.`);

  // 20. Transport Fleet, Routes & Passenger Roster
  await client.execute('DELETE FROM student_transport');
  await client.execute('DELETE FROM transport_stops');
  await client.execute('DELETE FROM transport_routes');

  const routes = [
    { id: 1, name: 'Bayarghari - Sundar Bazar Line', vehicle_no: 'Ga 1 Kha 4022', driver_name: 'Ram Bahadur Thapa', driver_phone: '9846012345', monthly_fee: 1500 },
    { id: 2, name: 'Waling - Bheerkot Highway Express', vehicle_no: 'Ga 1 Kha 3850', driver_name: 'Krishna Manandhar', driver_phone: '9846023456', monthly_fee: 2000 },
    { id: 3, name: 'Galyang - Mirmee Rural Connector', vehicle_no: 'Ba 2 Kha 5120', driver_name: 'Hari Shrestha', driver_phone: '9846034567', monthly_fee: 2200 },
    { id: 4, name: 'Syangja Bazar - Putalibazar Feeder', vehicle_no: 'Ga 1 Kha 4190', driver_name: 'Dhan Bahadur Gurung', driver_phone: '9846045678', monthly_fee: 2400 },
  ];

  for (const r of routes) {
    await client.execute({
      sql: `INSERT INTO transport_routes (id, name, vehicle_no, driver_name, driver_phone, monthly_fee)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, r.name, r.vehicle_no, r.driver_name, r.driver_phone, r.monthly_fee],
    });
  }

  const transportStops = [
    { id: 1, route_id: 1, name: 'Bayarghari Main Chowk', pickup_time: '08:30', sort_order: 1 },
    { id: 2, route_id: 1, name: 'Sundar Bazar Gate', pickup_time: '08:45', sort_order: 2 },
    { id: 3, route_id: 1, name: 'Balodaya Campus Ground', pickup_time: '09:05', sort_order: 3 },
    { id: 4, route_id: 2, name: 'Waling Central Buspark', pickup_time: '08:15', sort_order: 1 },
    { id: 5, route_id: 2, name: 'Bhumre Health Post', pickup_time: '08:35', sort_order: 2 },
    { id: 6, route_id: 2, name: 'Bheerkot-06 Turn', pickup_time: '08:55', sort_order: 3 },
  ];

  for (const ts of transportStops) {
    await client.execute({
      sql: `INSERT INTO transport_stops (id, route_id, name, pickup_time, sort_order)
            VALUES (?, ?, ?, ?, ?)`,
      args: [ts.id, ts.route_id, ts.name, ts.pickup_time, ts.sort_order],
    });
  }

  const studentTransports = [
    { student_id: 1, route_id: 1, stop_id: 2 }, // Aarav Sharma on Route 1
    { student_id: 2, route_id: 1, stop_id: 1 }, // Bikash Thapa on Route 1
    { student_id: 4, route_id: 2, stop_id: 4 }, // Pooja Adhikari on Route 2
    { student_id: 6, route_id: 1, stop_id: 2 }, // Ananya Sharma on Route 1
  ];

  for (const st of studentTransports) {
    await client.execute({
      sql: `INSERT INTO student_transport (student_id, route_id, stop_id) VALUES (?, ?, ?)`,
      args: [st.student_id, st.route_id, st.stop_id],
    });
  }
  console.log(`✓ Seeded ${routes.length} Fleet Routes, Stops & Student Passenger Rosters.`);

  // 21. Collegiate House Points Ledger
  await client.execute('DELETE FROM house_points');
  const housePoints = [
    { house_id: 1, points: 50, reason: 'Champions - Inter-House Football Tournament 2083', awarded_on: '2026-09-20', awarded_by: 10 },
    { house_id: 3, points: 30, reason: 'Runners-up - Inter-House Football Tournament 2083', awarded_on: '2026-09-20', awarded_by: 10 },
    { house_id: 2, points: 40, reason: 'First Position - Grand Inter-House Quiz Championship', awarded_on: '2026-10-02', awarded_by: 2 },
    { house_id: 4, points: 25, reason: 'Second Position - Grand Inter-House Quiz Championship', awarded_on: '2026-10-02', awarded_by: 2 },
    { house_id: 5, points: 35, reason: 'First Position - Creative Writing & Nepali Essay Competition', awarded_on: '2026-10-05', awarded_by: 9 },
    { house_id: 4, points: 30, reason: 'Exemplary Campus Cleanliness & Eco-Club Gardening Drive', awarded_on: '2026-10-08', awarded_by: 6 },
    { house_id: 3, points: 45, reason: 'Gold Medal - National Constitution Day March Past & Drill', awarded_on: '2026-09-19', awarded_by: 10 },
    { house_id: 1, points: 20, reason: 'Winners - Junior Spelling Bee Contest', awarded_on: '2026-10-09', awarded_by: 7 },
    { house_id: 2, points: -5, reason: 'Minor House Discipline Deduction (Assembly Tardiness)', awarded_on: '2026-10-04', awarded_by: 6 },
    { house_id: 5, points: 25, reason: 'Cultural Folk Dance & Music Showcase Performance', awarded_on: '2026-09-25', awarded_by: 9 },
  ];

  for (const hp of housePoints) {
    await client.execute({
      sql: `INSERT INTO house_points (house_id, points, reason, awarded_on, awarded_by)
            VALUES (?, ?, ?, ?, ?)`,
      args: [hp.house_id, hp.points, hp.reason, hp.awarded_on, hp.awarded_by],
    });
  }
  console.log(`✓ Seeded Collegiate House Points Ledger (Red, Yellow, Blue, Green, Orange).`);

  // 22. Online Admission Applications
  await client.execute('DELETE FROM applications');
  const applications = [
    {
      reference: 'APP-2083-00001',
      student_name: 'Milan Adhikari',
      dob: '2069-07-14',
      gender: 'male',
      class_applying: 'Class 8',
      guardian_name: 'Bharat Adhikari',
      guardian_phone: '9846011223',
      guardian_email: 'bharat.adhikari@example.com',
      address: 'Bheerkot-07, Syangja',
      previous_school: 'Janata Secondary School',
      notes: 'Transferring due to family relocation closer to Sundar Bazar.',
      status: 'new',
    },
    {
      reference: 'APP-2083-00002',
      student_name: 'Pabitra Gurung',
      dob: '2075-02-19',
      gender: 'female',
      class_applying: 'Class 1',
      guardian_name: 'Surya Gurung',
      guardian_phone: '9846022334',
      guardian_email: 'surya.gurung@example.com',
      address: 'Bayarghari South',
      previous_school: 'Little Stars Kindergarten',
      notes: 'Completed UKG with A+ grade. Interested in school transport route 1.',
      status: 'reviewing',
    },
    {
      reference: 'APP-2083-00003',
      student_name: 'Kushal KC',
      dob: '2068-11-05',
      gender: 'male',
      class_applying: 'Class 9',
      guardian_name: 'Deepak KC',
      guardian_phone: '9846033445',
      guardian_email: 'deepak.kc@example.com',
      address: 'Waling-05, Syangja',
      previous_school: 'Adarsha Vidya Mandir',
      notes: 'Application approved for entrance evaluation.',
      status: 'accepted',
    },
  ];

  for (const app of applications) {
    await client.execute({
      sql: `INSERT INTO applications (reference, student_name, dob, gender, class_applying, guardian_name, guardian_phone, guardian_email, address, previous_school, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        app.reference,
        app.student_name,
        app.dob,
        app.gender,
        app.class_applying,
        app.guardian_name,
        app.guardian_phone,
        app.guardian_email,
        app.address,
        app.previous_school,
        app.notes,
        app.status,
      ],
    });
  }
  console.log(`✓ Seeded ${applications.length} Online Admission Applications.`);

  // 23. Vacancies & Job Applications
  await client.execute('DELETE FROM job_applications');
  await client.execute('DELETE FROM vacancies');

  const vacancies = [
    {
      id: 1,
      title: 'Secondary Level Science Teacher (Physics / Chemistry)',
      type: 'teaching',
      description: 'Seeking a dynamic educator with minimum B.Sc./B.Ed. in Physics or Chemistry to teach Classes 9 and 10 with experimental laboratory demonstrations.',
      deadline: '2026-11-10',
      published: 1,
    },
    {
      id: 2,
      title: 'Pre-Primary Montessori Incharge / Kindergarten Teacher',
      type: 'teaching',
      description: 'Qualified early childhood educator with passionate child-centric approach and Montessori training for Nursery/LKG classes.',
      deadline: '2026-11-15',
      published: 1,
    },
    {
      id: 3,
      title: 'ICT Lab Assistant & Network Support Technician',
      type: 'non-teaching',
      description: 'Responsible for ATAL Digicamp hardware maintenance, student lab assistance, and school Wi-Fi systems.',
      deadline: '2026-11-20',
      published: 1,
    },
  ];

  for (const v of vacancies) {
    await client.execute({
      sql: `INSERT INTO vacancies (id, title, type, description, deadline, published)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [v.id, v.title, v.type, v.description, v.deadline, v.published],
    });
  }

  await client.execute({
    sql: `INSERT INTO job_applications (vacancy_id, name, phone, email, message, cv_path, status)
          VALUES (1, 'Ramesh Babu Sharma', '9846099887', 'ramesh.physics@example.com', 'M.Sc. Physics graduate with 4 years secondary teaching experience.', 'public/assets/documents/student-leave-application.pdf', 'shortlisted')`,
  });
  console.log(`✓ Seeded Careers Vacancies & Candidate Applications.`);

  // 24. Learning Resources & Question Banks
  await client.execute('DELETE FROM resources');
  const resources = [
    {
      id: 1,
      kind: 'question-bank',
      title: 'Class 10 SEE Model Question Bank - Compulsory Mathematics 2083',
      class_id: 13,
      subject_id: 1,
      file_path: 'public/assets/documents/student-leave-application.pdf',
      published: 1,
      uploaded_by: 2,
    },
    {
      id: 2,
      kind: 'exam-portion',
      title: 'Class 9 First Terminal Syllabus & Portion Breakdown 2083',
      class_id: 12,
      subject_id: 4,
      file_path: 'public/assets/documents/student-leave-application.pdf',
      published: 1,
      uploaded_by: 2,
    },
    {
      id: 3,
      kind: 'policy',
      title: 'Balodaya Student Code of Conduct & Academic Handbook 2083',
      class_id: null,
      subject_id: null,
      file_path: 'public/assets/documents/student-leave-application.pdf',
      published: 1,
      uploaded_by: 1,
    },
    {
      id: 4,
      kind: 'question-bank',
      title: 'Class 8 Basic Level Examination (BLE) Practice Paper 2083',
      class_id: 11,
      subject_id: 4,
      file_path: 'public/assets/documents/student-leave-application.pdf',
      published: 1,
      uploaded_by: 2,
    },
  ];

  for (const res of resources) {
    await client.execute({
      sql: `INSERT INTO resources (id, kind, title, class_id, subject_id, file_path, published, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [res.id, res.kind, res.title, res.class_id, res.subject_id, res.file_path, res.published, res.uploaded_by],
    });
  }
  console.log(`✓ Seeded ${resources.length} Downloadable Model Question Banks & Syllabi.`);

  // 25. Tenders & Public Circulars
  await client.execute('DELETE FROM tenders');
  await client.execute({
    sql: `INSERT INTO tenders (id, title, description, file_path, deadline, published)
          VALUES (1, 'Tender Notice: Procurement of Digital Smartboards & Science Lab Apparatus (Tender No: BSS-01/2083)',
                  'Sealed tenders are invited from registered suppliers for delivery and installation of interactive digital panels and physics/chemistry laboratory consumables.',
                  'public/assets/documents/student-leave-application.pdf',
                  '2026-11-30', 1)`,
  });
  console.log(`✓ Seeded Official Procurement Tenders.`);

  // 26. Inquiries, Feedback & Testimonials
  await client.execute('DELETE FROM messages');
  const messages = [
    {
      kind: 'contact',
      name: 'Gopal Krishna Regmi',
      phone: '9856011992',
      email: 'gopal.regmi@example.com',
      subject: 'Inquiry regarding hostel accommodations and transportation',
      body: 'Greetings. We reside in Galyang and are planning to enroll our daughter in Class 7 for the upcoming term. Do you offer residential hostel facilities?',
      status: 'new',
    },
    {
      kind: 'testimonial',
      name: 'Sabina Thapa (Batch 2079)',
      phone: '9846077112',
      email: 'sabina.thapa@example.com',
      subject: 'Alumni Testimonial',
      body: 'Balodaya School gave me the foundation, critical thinking skills, and moral character that allowed me to top my SEE exams and earn a full scholarship in Kathmandu. Proud to be a Balodayan!',
      status: 'published',
    },
    {
      kind: 'transfer-certificate',
      name: 'Pradeep Sharma',
      phone: '9846055443',
      email: 'pradeep.sharma@example.com',
      subject: 'TC Verification Request',
      body: 'Requesting verification and digital copy of Transfer Certificate for graduate admission clearance.',
      status: 'done',
    },
    {
      kind: 'alumni',
      name: 'Er. Manoj Gurung (Batch 2074)',
      phone: '9846033991',
      email: 'manoj.gurung@example.com',
      subject: 'Alumni Network Registration',
      body: 'Civil Engineer currently working on Gandaki hydropower infrastructure. Eager to mentor graduating SEE students during career day.',
      status: 'published',
    },
  ];

  for (const m of messages) {
    await client.execute({
      sql: `INSERT INTO messages (kind, name, phone, email, subject, body, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [m.kind, m.name, m.phone, m.email, m.subject, m.body, m.status],
    });
  }
  console.log(`✓ Seeded Public Inquiries, TC Requests, and Alumni Submissions.`);

  // 27. Audit Logs
  await client.execute('DELETE FROM audit_log');
  const auditLogs = [
    { user_id: 1, action: 'ACADEMIC_YEAR_ACTIVATED', entity: 'academic_years', entity_id: 1, detail: 'Activated academic session 2083 B.S.' },
    { user_id: 1, action: 'CURRICULUM_UPDATED', entity: 'class_subjects', entity_id: 12, detail: 'Assigned teacher rosters for Secondary Level Class 9' },
    { user_id: 5, action: 'INVOICES_GENERATED_BULK', entity: 'invoices', entity_id: 1, detail: 'Generated monthly tuition invoices for Class 9 and Class 10' },
    { user_id: 5, action: 'PAYMENT_RECORDED', entity: 'payments', entity_id: 1, detail: 'Processed receipt RCP-2083-00001 (NPR 3,200 via eSewa)' },
    { user_id: 2, action: 'ATTENDANCE_RECORDED', entity: 'attendance', entity_id: 1, detail: 'Marked daily attendance for Class 9-A' },
    { user_id: 2, action: 'MARKS_SUBMITTED', entity: 'marks', entity_id: 1, detail: 'Submitted First Terminal Examination mathematics marks' },
    { user_id: 6, action: 'LEAVE_APPROVED', entity: 'leave_requests', entity_id: 2, detail: 'Approved medical leave request for Chandra Gurung' },
    { user_id: 10, action: 'HOUSE_POINTS_AWARDED', entity: 'house_points', entity_id: 1, detail: 'Awarded 50 points to Red House for Football Championship' },
  ];

  for (const al of auditLogs) {
    await client.execute({
      sql: `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
            VALUES (?, ?, ?, ?, ?)`,
      args: [al.user_id, al.action, al.entity, al.entity_id, al.detail],
    });
  }
  console.log(`✓ Seeded System Audit Trail Activity.`);

  // 28. Final Database Counts Verification
  const counts = await Promise.all([
    client.execute('SELECT count(*) as c FROM users'),
    client.execute('SELECT count(*) as c FROM classes'),
    client.execute('SELECT count(*) as c FROM sections'),
    client.execute('SELECT count(*) as c FROM subjects'),
    client.execute('SELECT count(*) as c FROM students'),
    client.execute('SELECT count(*) as c FROM enrollments'),
    client.execute('SELECT count(*) as c FROM attendance'),
    client.execute('SELECT count(*) as c FROM exams'),
    client.execute('SELECT count(*) as c FROM marks'),
    client.execute('SELECT count(*) as c FROM invoices'),
    client.execute('SELECT count(*) as c FROM payments'),
    client.execute('SELECT count(*) as c FROM books'),
    client.execute('SELECT count(*) as c FROM book_loans'),
    client.execute('SELECT count(*) as c FROM transport_routes'),
    client.execute('SELECT count(*) as c FROM house_points'),
    client.execute('SELECT count(*) as c FROM notices'),
  ]);

  // Re-enable FK constraints
  await client.execute('PRAGMA foreign_keys = ON');

  console.log('\n========================================================');
  console.log('DATABASE SEEDING VERIFICATION SUMMARY');
  console.log('========================================================');
  console.log(`- Users:            ${counts[0].rows[0].c}`);
  console.log(`- Classes:          ${counts[1].rows[0].c}`);
  console.log(`- Sections:         ${counts[2].rows[0].c}`);
  console.log(`- Subjects:         ${counts[3].rows[0].c}`);
  console.log(`- Students:         ${counts[4].rows[0].c}`);
  console.log(`- Enrollments:      ${counts[5].rows[0].c}`);
  console.log(`- Attendance Logs:  ${counts[6].rows[0].c}`);
  console.log(`- Exams:            ${counts[7].rows[0].c}`);
  console.log(`- Marks Records:    ${counts[8].rows[0].c}`);
  console.log(`- Invoices:         ${counts[9].rows[0].c}`);
  console.log(`- Payment Receipts: ${counts[10].rows[0].c}`);
  console.log(`- Library Books:    ${counts[11].rows[0].c}`);
  console.log(`- Book Loans:       ${counts[12].rows[0].c}`);
  console.log(`- Bus Routes:       ${counts[13].rows[0].c}`);
  console.log(`- House Points:     ${counts[14].rows[0].c}`);
  console.log(`- Notices & News:   ${counts[15].rows[0].c}`);
  console.log('========================================================\n');
  console.log('Demo data seeding successfully completed!');
}

seed().catch((err) => {
  console.error('Fatal error during database seeding:', err);
  process.exit(1);
});
