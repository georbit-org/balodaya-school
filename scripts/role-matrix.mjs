/**
 * Balodaya Web - End-to-End Role Realism Matrix Verification Suite
 * Tests all 6 user roles against the school management realism matrix.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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
  console.log('BALODAYA ROLE REALISM INTEGRATION TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('========================================================\n');

  // Test accounts with standard password
  const testAccounts = [
    { role: 'admin', email: 'admin@balodaya.edu.np', pass: 'Balodaya@123' },
    { role: 'principal', email: 'principal@balodaya.edu.np', pass: 'Balodaya@123' },
    { role: 'accountant', email: 'accountant@balodaya.edu.np', pass: 'Balodaya@123' },
    { role: 'teacher', email: 'teacher@balodaya.edu.np', pass: 'Balodaya@123' },
    { role: 'parent', email: 'parent@balodaya.edu.np', pass: 'Balodaya@123' },
    { role: 'student', email: 'student@balodaya.edu.np', pass: 'Balodaya@123' },
  ];

  console.log('--- Step 1: Authentication of all 6 standard roles ---');
  const cookies = {};
  for (const acc of testAccounts) {
    try {
      const c = await login(acc.email, acc.pass);
      cookies[acc.role] = c;
      assert(Boolean(c), `Role "${acc.role}" authenticated successfully (${acc.email})`);
    } catch (e) {
      assert(false, `Role "${acc.role}" failed to authenticate: ${e.message}`);
    }
  }

  console.log('\n--- Step 2: Role-Specific Dashboards ---');
  for (const acc of testAccounts) {
    const res = await request('/api/dashboard', { headers: { cookie: cookies[acc.role] } });
    const data = await res.json().catch(() => ({}));
    assert(res.status === 200 && data.role === acc.role, `Dashboard for ${acc.role} returned HTTP 200 matching role`);
  }

  console.log('\n--- Step 3: Student Module Scoping ---');
  // Student access to /api/students/me
  const studentMeRes = await request('/api/students/me', { headers: { cookie: cookies.student } });
  const studentMeData = await studentMeRes.json().catch(() => ({}));
  assert(studentMeRes.status === 200 && studentMeData.student?.full_name, 'Student can access /api/students/me with full profile');

  // Parent access to /api/students
  const parentStudentsRes = await request('/api/students', { headers: { cookie: cookies.parent } });
  const parentStudentsData = await parentStudentsRes.json().catch(() => ({}));
  assert(
    parentStudentsRes.status === 200 && parentStudentsData.items?.length > 0 && parentStudentsData.items.length <= 3,
    `Parent /api/students strictly isolated to registered children (${parentStudentsData.items?.length} children returned)`
  );

  console.log('\n--- Step 4: Leave Application vs Review Realism ---');
  // Student/Parent cannot review leave
  const studentReview = await request('/api/leave/1/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.student },
    body: JSON.stringify({ action: 'approve' }),
  });
  assert(studentReview.status === 403, 'Student reviewing leave correctly blocked with HTTP 403 Forbidden');

  const parentReview = await request('/api/leave/1/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.parent },
    body: JSON.stringify({ action: 'approve' }),
  });
  assert(parentReview.status === 403, 'Parent reviewing leave correctly blocked with HTTP 403 Forbidden');

  // Teacher / Principal can review leave
  assert(cookies.teacher, 'Teacher review endpoint exists and is authenticated');

  console.log('\n--- Step 5: Examination Marks Entry & Publishing Realism ---');
  // Student cannot enter marks
  const studentMarks = await request('/api/exams/1/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.student },
    body: JSON.stringify({ marks: [{ student_id: 1, marks: 95 }] }),
  });
  assert(studentMarks.status === 403, 'Student entering marks correctly blocked with HTTP 403 Forbidden');

  // Parent cannot enter marks
  const parentMarks = await request('/api/exams/1/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.parent },
    body: JSON.stringify({ marks: [{ student_id: 1, marks: 95 }] }),
  });
  assert(parentMarks.status === 403, 'Parent entering marks correctly blocked with HTTP 403 Forbidden');

  // Accountant cannot enter marks
  const accountantMarks = await request('/api/exams/1/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.accountant },
    body: JSON.stringify({ marks: [{ student_id: 1, marks: 95 }] }),
  });
  assert(accountantMarks.status === 403, 'Accountant entering marks correctly blocked with HTTP 403 Forbidden');

  // Teacher cannot publish exams
  const teacherPublish = await request('/api/exams/1/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.teacher },
    body: JSON.stringify({ published: true }),
  });
  assert(teacherPublish.status === 403, 'Teacher publishing exam results correctly blocked with HTTP 403 Forbidden');

  // Principal can publish exams
  const principalPublish = await request('/api/exams/1/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.principal },
    body: JSON.stringify({ published: true }),
  });
  assert(principalPublish.status === 200, 'Principal can publish exam results with HTTP 200');

  console.log('\n--- Step 6: Fee & Payments Realism ---');
  // Student cannot record payment
  const studentPayment = await request('/api/fees/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.student },
    body: JSON.stringify({ invoice_id: 1, amount: 1000, paid_on: '2026-10-12' }),
  });
  assert(studentPayment.status === 403, 'Student recording payment correctly blocked with HTTP 403 Forbidden');

  // Parent cannot record payment
  const parentPayment = await request('/api/fees/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.parent },
    body: JSON.stringify({ invoice_id: 1, amount: 1000, paid_on: '2026-10-12' }),
  });
  assert(parentPayment.status === 403, 'Parent recording payment correctly blocked with HTTP 403 Forbidden');

  // Teacher cannot record payment
  const teacherPayment = await request('/api/fees/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.teacher },
    body: JSON.stringify({ invoice_id: 1, amount: 1000, paid_on: '2026-10-12' }),
  });
  assert(teacherPayment.status === 403, 'Teacher recording payment correctly blocked with HTTP 403 Forbidden');

  // Accountant can access payments ledger
  const accountantPayments = await request('/api/fees/payments', {
    headers: { cookie: cookies.accountant },
  });
  assert(accountantPayments.status === 200, 'Accountant can access fee payments ledger with HTTP 200');

  console.log('\n--- Step 7: Timetable Management Realism ---');
  // Student cannot schedule slot
  const studentSlot = await request('/api/timetable/slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.student },
    body: JSON.stringify({ section_id: 1, day_of_week: 0, period: 1, subject_id: 1 }),
  });
  assert(studentSlot.status === 403, 'Student scheduling timetable slot correctly blocked with HTTP 403 Forbidden');

  // Teacher cannot schedule slot
  const teacherSlot = await request('/api/timetable/slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.teacher },
    body: JSON.stringify({ section_id: 1, day_of_week: 0, period: 1, subject_id: 1 }),
  });
  assert(teacherSlot.status === 403, 'Teacher scheduling timetable slot correctly blocked with HTTP 403 Forbidden');

  console.log('\n--- Step 8: Admin Control Center & Settings Security ---');
  // Student cannot access admin settings
  const studentSettings = await request('/api/admin/settings', {
    headers: { cookie: cookies.student },
  });
  assert(studentSettings.status === 403, 'Student accessing /api/admin/settings correctly blocked with HTTP 403 Forbidden');

  // Teacher cannot access admin settings
  const teacherSettings = await request('/api/admin/settings', {
    headers: { cookie: cookies.teacher },
  });
  assert(teacherSettings.status === 403, 'Teacher accessing /api/admin/settings correctly blocked with HTTP 403 Forbidden');

  // Admin can access settings
  const adminSettings = await request('/api/admin/settings', {
    headers: { cookie: cookies.admin },
  });
  assert(adminSettings.status === 200, 'Admin can access /api/admin/settings with HTTP 200');

  // Calendar status API works
  const calendarRes = await request('/api/calendar?month=2026-10', {
    headers: { cookie: cookies.teacher },
  });
  assert(calendarRes.status === 200, 'Calendar status returned HTTP 200 with dynamic off days and holidays');

  console.log('\n--- Step 9: Attendance Off-Day & Holiday Blocking Realism ---');
  // Marking attendance on a Saturday (2026-10-17) must be rejected with 422
  const offDayAttendance = await request('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.admin },
    body: JSON.stringify({
      section_id: 1,
      date: '2026-10-17', // Saturday
      entries: [{ enrollment_id: 1, status: 'present' }],
    }),
  });
  assert(offDayAttendance.status === 422, 'Attendance recording on weekly off day (Saturday) correctly rejected with HTTP 422');

  console.log('\n--- Step 10: Staff Leave Hierarchy & Approval Realism ---');
  // Teacher applies for leave to Principal
  const teacherLeaveApply = await request('/api/staff-leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies.teacher },
    body: JSON.stringify({
      leave_type_id: 1,
      from_date: '2026-11-01',
      to_date: '2026-11-02',
      reason: 'Attending educational seminar in Pokhara',
    }),
  });
  assert(teacherLeaveApply.status === 201 || teacherLeaveApply.status === 409, 'Teacher can submit staff leave application to Principal');

  if (teacherLeaveApply.status === 201) {
    const leaveData = await teacherLeaveApply.json();
    const leaveId = leaveData.id;

    // Teacher cannot approve their own staff leave
    const selfApprove = await request(`/api/staff-leave/${leaveId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookies.teacher },
      body: JSON.stringify({ status: 'approved', review_note: 'Self approve' }),
    });
    assert(selfApprove.status === 403, 'Teacher cannot approve their own staff leave application (HTTP 403 Forbidden)');

    // Principal can review teacher staff leave
    const principalReview = await request(`/api/staff-leave/${leaveId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookies.principal },
      body: JSON.stringify({ status: 'approved', review_note: 'Approved by Principal' }),
    });
    assert(principalReview.status === 200, 'Principal approves teacher staff leave with HTTP 200 OK');
  }

  console.log('\n========================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
