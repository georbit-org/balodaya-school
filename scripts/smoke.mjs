/**
 * Balodaya Web Comprehensive Automated Smoke Test
 */

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  return res;
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login failed for ${email}: ${err.error || res.status}`);
  }
  const cookie = res.headers.get('set-cookie');
  return cookie ? cookie.split(';')[0] : '';
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('========================================================');
  console.log('BALODAYA WEB COMPREHENSIVE AUTOMATED SMOKE SUITE');
  console.log('========================================================\n');

  // 1. PUBLIC ROUTES
  console.log('--- 1. Testing Public Routes ---');
  const publicRoutes = [
    '/',
    '/about',
    '/academics',
    '/admissions',
    '/student-life',
    '/facilities',
    '/gallery',
    '/news',
    '/tenders',
    '/careers',
    '/contact',
    '/login',
  ];

  for (const route of publicRoutes) {
    const res = await request(route);
    assert(res.status === 200, `Public route ${route} returned HTTP 200`);
  }

  // 2. AUTHENTICATION & ROLES
  console.log('\n--- 2. Testing Authentication & RBAC ---');

  // Invalid login rejection
  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@balodaya.edu.np', password: 'WrongPassword123!' }),
  });
  assert(badLogin.status === 401, 'Invalid password correctly rejected with HTTP 401');

  // Unauthorized API guard
  const unauth = await request('/api/dashboard');
  assert(unauth.status === 401, 'Unauthenticated /api/dashboard returns HTTP 401');

  // Login all 5 seeded roles
  const roles = [
    { email: 'admin@balodaya.edu.np', pass: 'AdminBalodaya2063!', role: 'admin' },
    { email: 'bishnu.pokharel@balodaya.edu.np', pass: 'Balodaya2063!', role: 'teacher' },
    { email: 'accountant@balodaya.edu.np', pass: 'Balodaya2063!', role: 'accountant' },
    { email: 'sita.sharma@balodaya.edu.np', pass: 'Balodaya2063!', role: 'parent' },
    { email: 'aarav.sharma@balodaya.edu.np', pass: 'Balodaya2063!', role: 'student' },
  ];

  const cookies = {};
  for (const u of roles) {
    try {
      const c = await login(u.email, u.pass);
      cookies[u.role] = c;
      assert(Boolean(c), `Successfully logged in as ${u.role} (${u.email})`);
    } catch (e) {
      assert(false, `Failed to login as ${u.role}: ${e.message}`);
    }
  }

  // 3. ROLE-TAILORED DASHBOARDS
  console.log('\n--- 3. Testing Role-Tailored Dashboards ---');
  for (const u of roles) {
    const res = await request('/api/dashboard', {
      headers: { cookie: cookies[u.role] },
    });
    const data = await res.json().catch(() => ({}));
    assert(res.status === 200 && data.role === u.role, `Dashboard for ${u.role} returned HTTP 200 with matching role`);
  }

  // 4. OPERATIONAL MODULES
  console.log('\n--- 4. Testing Core Operational Modules ---');

  // 4.1 Notice creation & public visibility
  const noticeRes = await request('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      title: 'Smoke Test Announcement',
      body: 'This notice was posted by the automated smoke test suite.',
      kind: 'notice',
      audience: 'public',
      published: 1,
    }),
  });
  const noticeData = await noticeRes.json();
  const noticeCreated = (noticeRes.status === 200 || noticeRes.status === 201) && Boolean(noticeData.id);
  assert(noticeCreated, 'Admin successfully created published public notice');

  // Verify public view of notice
  const pubNotices = await request('/api/notices?audience=public');
  const pubNoticesData = await pubNotices.json();
  const foundNotice = pubNoticesData.items?.some((n) => n.id === noticeData.id);
  assert(foundNotice, 'Created notice appears in public notices query items');

  // 4.2 Timetable Collision Detection
  const clashTest = await request('/api/timetable/slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      section_id: 1,
      day_of_week: 'Sunday',
      period_number: 1,
      start_time: '10:00',
      end_time: '10:45',
      subject_id: 1,
      teacher_id: 2,
      room_no: 'Room 101',
    }),
  });
  // Slot 1 is already seeded with teacher 2, period 1 on Sunday
  assert(clashTest.status === 400, 'Timetable conflict detector properly rejected slot collision with HTTP 400');

  // 4.3 Library Availability & Loan Limit
  // Seed book 2 has total_copies = 2. It already had 2 loans issued. A 3rd loan must fail!
  const loanOverdraft = await request('/api/library/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      book_id: 2,
      student_id: 3,
      due_on: '2026-11-01',
    }),
  });
  assert(loanOverdraft.status === 400, 'Library overdraft loan correctly rejected with HTTP 400 (No copies available)');

  // 4.4 House Points Ledger & Standings
  const awardPoints = await request('/api/houses/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      house_id: 1,
      points: 5,
      reason: 'Smoke Test Inter-House Drill',
    }),
  });
  assert(awardPoints.status === 200 || awardPoints.status === 201, 'Admin successfully awarded points to Red House');

  const houseTotals = await request('/api/houses');
  const houseData = await houseTotals.json();
  assert(houseTotals.status === 200 && houseData.houses?.length === 5, 'House standings API returns all 5 collegiate houses');

  // 4.5 Exam Results & Ranking Engine
  const examResultsRes = await request('/api/exams/1/results?section_id=1', {
    headers: { cookie: cookies.admin },
  });
  const examResultsData = await examResultsRes.json();
  assert(
    examResultsRes.status === 200 && examResultsData.results?.length === 3,
    'Exam results computation returned all 3 ranked Class 9 students'
  );

  // 4.6 Transport Route Roster
  const transportRoster = await request('/api/transport/routes/1/roster', {
    headers: { cookie: cookies.admin },
  });
  const rosterData = await transportRoster.json();
  assert(transportRoster.status === 200 && rosterData.passengers?.length >= 1, 'Transport route roster returns assigned students');

  // 4.7 Resource Download Stream
  const downloadRes = await request('/api/resources/1/download');
  assert(downloadRes.status === 200, 'Published resource download stream returns HTTP 200');

  // 4.8 Contact Message & Career Submissions
  const contactMsg = await request('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'contact',
      name: 'Smoke Tester',
      email: 'tester@example.com',
      subject: 'Inquiry Verification',
      body: 'Automated contact message test.',
    }),
  });
  assert(contactMsg.status === 200 || contactMsg.status === 201, 'Public contact message submission returns HTTP 200/201');

  // 4.9 Dynamic Hero Slideshow & Role Permissions
  console.log('\n--- 4.9 Testing Dynamic Hero Slideshow & Role Permissions ---');
  // Public feed
  const heroPublic = await request('/api/hero-slides');
  const heroPubData = await heroPublic.json();
  assert(heroPublic.status === 200 && Array.isArray(heroPubData.docs) && heroPubData.docs.length >= 1, 'Public GET /api/hero-slides returns HTTP 200 and active slides');

  // Admin access
  const heroAdmin = await request('/api/admin/hero-slides', { headers: { cookie: cookies.admin } });
  assert(heroAdmin.status === 200, 'Admin GET /api/admin/hero-slides returns HTTP 200');

  // Teacher access (permitted)
  const heroTeacher = await request('/api/admin/hero-slides', { headers: { cookie: cookies.teacher } });
  assert(heroTeacher.status === 200, 'Teacher GET /api/admin/hero-slides returns HTTP 200 (delegated slideshow control)');

  // Student access (forbidden)
  const heroStudent = await request('/api/admin/hero-slides', { headers: { cookie: cookies.student } });
  assert(heroStudent.status === 403, 'Student GET /api/admin/hero-slides is correctly forbidden with HTTP 403');

  // Unauthenticated access (unauthorized)
  const heroUnauth = await request('/api/admin/hero-slides');
  assert(heroUnauth.status === 401, 'Unauthenticated GET /api/admin/hero-slides returns HTTP 401');

  // Admin create, update, delete cycle
  const testSlideId = `test-slide-${Date.now()}`;
  const createSlide = await request('/api/admin/hero-slides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      id: testSlideId,
      title: 'Smoke Test Hero Banner',
      badge: 'Testing Badge',
      subtitle: 'Created during automated smoke verification',
      image: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
      primary_cta_text: 'Learn More',
      primary_cta_link: '/about',
      display_order: 99,
      is_active: 1,
    }),
  });
  assert(createSlide.status === 201 || createSlide.status === 200, 'Admin successfully created new hero slide');

  const updateSlide = await request(`/api/admin/hero-slides/${testSlideId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      title: 'Updated Smoke Test Hero Banner',
      is_active: 0,
    }),
  });
  assert(updateSlide.status === 200, 'Admin successfully updated hero slide via PATCH');

  const deleteSlide = await request(`/api/admin/hero-slides/${testSlideId}`, {
    method: 'DELETE',
    headers: { cookie: cookies.admin },
  });
  assert(deleteSlide.status === 200, 'Admin successfully deleted test hero slide via DELETE');

  // 4.10 TESTING SHELL COUNTS, SEARCH PALETTE, & UI KIT
  console.log('\n--- 4.10 Testing Shell Counts, Search Palette & UI Kit ---');
  const shellUnauth = await request('/api/shell/counts');
  assert(shellUnauth.status === 401, 'Unauthenticated GET /api/shell/counts returns HTTP 401');

  const shellAdmin = await request('/api/shell/counts', { headers: { cookie: cookies.admin } });
  assert(shellAdmin.status === 200, 'Admin GET /api/shell/counts returns HTTP 200');

  const searchUnauth = await request('/api/search?q=aarav');
  assert(searchUnauth.status === 401, 'Unauthenticated GET /api/search returns HTTP 401');

  const searchAdmin = await request('/api/search?q=aarav', { headers: { cookie: cookies.admin } });
  assert(searchAdmin.status === 200, 'Admin GET /api/search returns HTTP 200');

  const uiKit = await request('/app/kit', { headers: { cookie: cookies.admin } });
  assert(uiKit.status === 200, 'Admin GET /app/kit returns HTTP 200');

  const paymentsPage = await request('/app/payments', { headers: { cookie: cookies.admin } });
  assert(paymentsPage.status === 200, 'Admin GET /app/payments returns HTTP 200');

  const paymentsApi = await request('/api/fees/payments', { headers: { cookie: cookies.admin } });
  assert(paymentsApi.status === 200, 'Admin GET /api/fees/payments returns HTTP 200');

  // 5. CSV REPORTS WITH UTF-8 BOM
  console.log('\n--- 5. Testing CSV Reports & UTF-8 BOM ---');
  const reports = [
    '/api/reports/students',
    '/api/reports/attendance?section_id=1&month=2026-10',
    '/api/reports/results?exam_id=1&section_id=1',
    '/api/reports/dues',
    '/api/reports/payments',
    '/api/reports/library-overdue',
  ];

  for (const r of reports) {
    const res = await request(r, { headers: { cookie: cookies.admin } });
    const buf = Buffer.from(await res.arrayBuffer());
    const isBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    assert(res.status === 200 && isBom, `Report ${r.split('?')[0]} returned HTTP 200 with Excel UTF-8 BOM`);
  }

  // 6. OFFICIAL PRINT PAGES
  console.log('\n--- 6. Testing Official Print Layouts ---');
  const printPages = [
    '/app/print/receipt/1',
    '/app/print/marksheet/1-1',
    '/app/print/tc/1',
  ];

  for (const p of printPages) {
    const res = await request(p, { headers: { cookie: cookies.admin } });
    assert(res.status === 200, `Print layout ${p} returned HTTP 200`);
  }

  // 7. SUMMARY
  console.log('\n========================================================');
  console.log(`SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error running smoke tests:', err);
  process.exit(1);
});
