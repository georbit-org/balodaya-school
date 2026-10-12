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

const adminEmail = process.env.ADMIN_EMAIL || 'admin@balodaya.edu.np';
const adminName = process.env.ADMIN_NAME || 'System Administrator';
const adminPassword = process.env.ADMIN_PASSWORD || 'BalodayaAdmin2026!';

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

async function init() {
  console.log('Initializing Balodaya School database at:', dbUrl);

  // Read schema.sql
  const schemaPath = path.join(process.cwd(), 'src', 'server', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split by semicolon, filter empty statements
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const sql of statements) {
    await client.execute(sql);
  }

  // 1. Seed Houses
  const houses = [
    { name: 'Red', motto: 'Igniting Passion, Fostering Unity, and Achieving Excellence!' },
    { name: 'Yellow', motto: 'Radiant Minds, Unified Hearts, Limitless Horizons!' },
    { name: 'Blue', motto: 'Soaring Beyond Boundaries, Uniting in Excellence!' },
    { name: 'Green', motto: 'Growing Together, Sowing Seeds of Success' },
    { name: 'Orange', motto: 'Blaze of Brilliance, Uniting in Triumph!' },
  ];

  for (const h of houses) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO houses (name, motto) VALUES (?, ?)',
      args: [h.name, h.motto],
    });
  }

  // 2. Seed Classes
  const classes = [
    { name: 'Nursery', sort: 1 },
    { name: 'LKG', sort: 2 },
    { name: 'UKG', sort: 3 },
    { name: 'Class 1', sort: 4 },
    { name: 'Class 2', sort: 5 },
    { name: 'Class 3', sort: 6 },
    { name: 'Class 4', sort: 7 },
    { name: 'Class 5', sort: 8 },
    { name: 'Class 6', sort: 9 },
    { name: 'Class 7', sort: 10 },
    { name: 'Class 8', sort: 11 },
    { name: 'Class 9', sort: 12 },
    { name: 'Class 10', sort: 13 },
    { name: 'Class 11', sort: 14 },
    { name: 'Class 12', sort: 15 },
  ];

  for (const c of classes) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO classes (name, sort_order) VALUES (?, ?)',
      args: [c.name, c.sort],
    });
  }

  // 3. Seed Grade Scale
  const grades = [
    { min: 90, grade: 'A+', gpa: 4.0 },
    { min: 80, grade: 'A', gpa: 3.6 },
    { min: 70, grade: 'B+', gpa: 3.2 },
    { min: 60, grade: 'B', gpa: 2.8 },
    { min: 50, grade: 'C+', gpa: 2.4 },
    { min: 40, grade: 'C', gpa: 2.0 },
    { min: 30, grade: 'D+', gpa: 1.6 },
    { min: 20, grade: 'D', gpa: 1.2 },
    { min: 0, grade: 'NG', gpa: 0.0 },
  ];

  const gradeCount = await client.execute('SELECT count(*) as cnt FROM grade_scale');
  if (Number(gradeCount.rows[0].cnt) === 0) {
    for (const g of grades) {
      await client.execute({
        sql: 'INSERT INTO grade_scale (min_percent, grade, gpa) VALUES (?, ?, ?)',
        args: [g.min, g.grade, g.gpa],
      });
    }
  }

  // 4. Seed Fee Heads
  const feeHeads = ['Tuition', 'Admission', 'Transport', 'Exam', 'Other'];
  for (const head of feeHeads) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO fee_heads (name) VALUES (?)',
      args: [head],
    });
  }

  // 5. Seed Academic Year
  await client.execute({
    sql: 'INSERT OR IGNORE INTO academic_years (name, is_current) VALUES (?, 1)',
    args: ['2083'],
  });

  // 6. Seed First Admin
  const existingAdmin = await client.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [adminEmail],
  });

  if (existingAdmin.rows.length === 0) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    await client.execute({
      sql: `INSERT INTO users (email, name, role, designation, password_hash, must_change_password, active)
            VALUES (?, ?, 'admin', 'System Administrator', ?, 1, 1)`,
      args: [adminEmail, adminName, passwordHash],
    });
    console.log(`Created administrator account: ${adminEmail}`);
  } else {
    console.log(`Administrator account already exists: ${adminEmail}`);
  }

  // 7. Seed Initial Hero Slides
  const initialSlides = [
    {
      id: 'slide-academic',
      badge: 'Academic Excellence · Kindergarten to Grade 10',
      title: 'Nurturing Character, Intellect, and Leadership in the Hills of Syangja',
      subtitle: 'Founded in 2063 B.S. in Sundar Bazar, Bheerkot-06. Combining rigorous academic discipline with values-based personal growth.',
      image: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
      primary_cta_text: 'Apply for Admission 2083/84',
      primary_cta_link: '/admissions',
      secondary_cta_text: 'Explore Academics',
      secondary_cta_link: '/academics',
      display_order: 1,
    },
    {
      id: 'slide-digital',
      badge: 'Science & Digital Innovation · 21st Century Skills',
      title: 'Empowering Curious Minds with Modern Digital & Science Education',
      subtitle: 'Dedicated computing laboratory camps, experiential science instruction, and comprehensive preparation for the Secondary Education Examination (SEE).',
      image: '/assets/images/facilities/Digicamp1.JPG',
      primary_cta_text: 'View Campus Facilities',
      primary_cta_link: '/facilities',
      secondary_cta_text: 'Curriculum Roadmap',
      secondary_cta_link: '/academics',
      display_order: 2,
    },
    {
      id: 'slide-athletics',
      badge: 'Athletics & Physical Vigor · Healthy Minds & Bodies',
      title: 'Fostering Teamwork, Resilience, and Sportsmanship Across All Grades',
      subtitle: 'Annual inter-house sports competitions, physical conditioning, yoga, and disciplined outdoor education on our mountain campus.',
      image: '/assets/images/home_page/banner/original/1689073824-3Banner3.jpg',
      primary_cta_text: 'Student Life & Athletics',
      primary_cta_link: '/student-life',
      secondary_cta_text: 'Campus Gallery',
      secondary_cta_link: '/gallery',
      display_order: 3,
    },
    {
      id: 'slide-cultural',
      badge: 'Cultural Heritage & Civic Pride · राष्ट्रको सभ्यता',
      title: 'Grounding Future Leaders in Community Values and National Character',
      subtitle: '“The Need of Education, Civilization of the Nation” — cultivating responsible, ethical Nepali citizens rooted in cultural pride.',
      image: '/assets/images/home_page/banner/original/1689073856-4Banner4.jpg',
      primary_cta_text: 'Our Origin & Vision',
      primary_cta_link: '/about',
      secondary_cta_text: 'Official Bulletins',
      secondary_cta_link: '/news',
      display_order: 4,
    },
    {
      id: 'slide-houses',
      badge: 'Red • Yellow • Blue • Green • Orange',
      title: 'House Pride, Athletics & Co-Curricular Triumph',
      subtitle: 'Five vibrant houses fostering sportsmanship, debate, cultural arts, and leadership',
      image: '/assets/images/houses/top.jpeg',
      primary_cta_text: 'Student Life & Houses',
      primary_cta_link: '/student-life',
      secondary_cta_text: 'Explore Academics',
      secondary_cta_link: '/academics',
      display_order: 5,
    },
  ];

  const slideCount = await client.execute('SELECT count(*) as cnt FROM hero_slides');
  if (Number(slideCount.rows[0].cnt) === 0) {
    for (const slide of initialSlides) {
      await client.execute({
        sql: `INSERT INTO hero_slides (id, badge, title, subtitle, image, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
          slide.id,
          slide.badge,
          slide.title,
          slide.subtitle,
          slide.image,
          slide.primary_cta_text,
          slide.primary_cta_link,
          slide.secondary_cta_text,
          slide.secondary_cta_link,
          slide.display_order,
        ],
      });
    }
    console.log('Seeded authentic initial hero slides.');
  }

  // Verification counts
  const houseRows = await client.execute('SELECT count(*) as c FROM houses');
  const classRows = await client.execute('SELECT count(*) as c FROM classes');
  const gradeRows = await client.execute('SELECT count(*) as c FROM grade_scale');
  const userRows = await client.execute('SELECT count(*) as c FROM users');
  const heroRows = await client.execute('SELECT count(*) as c FROM hero_slides');

  console.log(`Verified DB contents:
  - Houses: ${houseRows.rows[0].c}
  - Classes: ${classRows.rows[0].c}
  - Grade scale entries: ${gradeRows.rows[0].c}
  - Users: ${userRows.rows[0].c}
  - Hero slides: ${heroRows.rows[0].c}`);

  console.log('Database initialization complete.');
}

init().catch((err) => {
  console.error('Initialization failed:', err);
  process.exit(1);
});
