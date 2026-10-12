import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

console.log('========================================================');
console.log('BALODAYA TOTAL CMS INTEGRATION SCENARIO TEST');
console.log(`Target: ${BASE}`);
console.log('========================================================\n');

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}`);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'Expected session cookie');
  const cookieMatch = setCookie.match(/balodaya_session=([^;]+)/);
  assert.ok(cookieMatch, 'balodaya_session cookie extracted');
  return `balodaya_session=${cookieMatch[1]}`;
}

const adminCookie = await login('admin@balodaya.edu.np', 'Balodaya@123');
const studentCookie = await login('student@balodaya.edu.np', 'Balodaya@123');

console.log('--- Step 1: Listing CMS pages ---');
const pagesRes = await fetch(`${BASE}/api/cms/pages`, {
  headers: { cookie: adminCookie },
});
assert.equal(pagesRes.status, 200, 'Listing CMS pages returned HTTP 200');
const pages = await pagesRes.json();
assert.ok(pages.length >= 6, 'Found at least 6 seeded CMS pages');
console.log(`  ✓ Found ${pages.length} CMS pages in database`);

console.log('--- Step 2: Role Security Isolation ---');
const studentCreateRes = await fetch(`${BASE}/api/cms/pages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    cookie: studentCookie,
  },
  body: JSON.stringify({ title: 'Student Hacker Page', slug: 'hacked' }),
});
assert.equal(studentCreateRes.status, 403, 'Student creating CMS page blocked with 403');
console.log('  ✓ Student creating CMS page correctly blocked with HTTP 403');

const homePage = pages.find((p) => p.slug === '');
assert.ok(homePage, 'Found Home page');

const studentPublishRes = await fetch(`${BASE}/api/cms/pages/${homePage.id}/publish`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    cookie: studentCookie,
  },
  body: JSON.stringify({ note: 'Unauthorized publish' }),
});
assert.equal(studentPublishRes.status, 403, 'Student publishing CMS page blocked with 403');
console.log('  ✓ Student publishing CMS page correctly blocked with HTTP 403');

console.log('--- Step 3: Fetching and Editing Sections ---');
const homeDetailRes = await fetch(`${BASE}/api/cms/pages/${homePage.id}`, {
  headers: { cookie: adminCookie },
});
assert.equal(homeDetailRes.status, 200, 'Fetching home page details succeeded');
const homeDetail = await homeDetailRes.json();
assert.ok(homeDetail.sections.length > 0, 'Home page has sections');

// Edit section 4 (steps) title
const updatedSections = homeDetail.sections.map((sec) => {
  if (sec.type === 'steps') {
    return {
      ...sec,
      data: {
        ...sec.data,
        title: 'Verified Admission Pathway 2083/84',
      },
    };
  }
  return sec;
});

const saveRes = await fetch(`${BASE}/api/cms/pages/${homePage.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    cookie: adminCookie,
  },
  body: JSON.stringify({
    title: homeDetail.title,
    slug: homeDetail.slug,
    status: 'draft',
    sections: updatedSections,
  }),
});
assert.equal(saveRes.status, 200, 'Saving CMS page draft succeeded');
console.log('  ✓ Admin successfully edited section text and saved draft');

console.log('--- Step 4: Publishing CMS Page Live ---');
const publishRes = await fetch(`${BASE}/api/cms/pages/${homePage.id}/publish`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    cookie: adminCookie,
  },
  body: JSON.stringify({ note: 'Automated test publish verification' }),
});
assert.equal(publishRes.status, 200, 'Publishing CMS page returned HTTP 200');
const publishedPage = await publishRes.json();
assert.equal(publishedPage.status, 'published');
assert.ok(publishedPage.published_version_id, 'Generated published version ID');
console.log(`  ✓ Page published live with version snapshot #${publishedPage.published_version_id}`);

console.log('--- Step 5: Live Verification & Reversion ---');
const publicHtmlRes = await fetch(`${BASE}/`);
assert.equal(publicHtmlRes.status, 200, 'Public homepage returned 200');
const publicHtml = await publicHtmlRes.text();
assert.ok(
  publicHtml.includes('Verified Admission Pathway 2083/84'),
  'Live public homepage updated immediately with new section heading!'
);
console.log('  ✓ Live public homepage rendered updated heading without restart or build!');

// Verify anonymous visitor does not see admin editing bar
assert.ok(
  !publicHtml.includes('Admin CMS Mode: Editing'),
  'Public visitor never sees admin editing UI bar'
);
console.log('  ✓ Public visitor never sees admin editing bar or edit pills');

// Check versions history
const versionsRes = await fetch(`${BASE}/api/cms/pages/${homePage.id}/versions`, {
  headers: { cookie: adminCookie },
});
assert.equal(versionsRes.status, 200, 'Fetching version history succeeded');
const versions = await versionsRes.json();
assert.ok(versions.length >= 1, 'Version history has at least 1 snapshot');
console.log(`  ✓ Version history recorded ${versions.length} snapshot(s)`);

console.log('\n========================================================');
console.log('ALL CMS SCENARIO ASSERTIONS PASSED! ✓');
console.log('========================================================');
process.exit(0);
