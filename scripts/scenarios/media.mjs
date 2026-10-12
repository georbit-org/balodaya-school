import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

console.log('========================================================');
console.log('BALODAYA MEDIA LIBRARY INTEGRATION SCENARIO TEST');
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

console.log('--- Step 1: Listing media items ---');
const listRes = await fetch(`${BASE}/api/media?limit=10`, {
  headers: { cookie: adminCookie },
});
assert.equal(listRes.status, 200, 'Listing media returned HTTP 200');
const listData = await listRes.json();
assert.ok(listData.items.length > 0, 'Found media items');
console.log(`  ✓ Found ${listData.total} items in media library`);

console.log('--- Step 2: Role Authorization Checks ---');
// Student attempting upload must be forbidden (403)
const studentUploadForm = new FormData();
studentUploadForm.append('file', new Blob(['fake image data'], { type: 'image/png' }), 'test.png');
studentUploadForm.append('alt_text', 'Sample alt text');

const studentUploadRes = await fetch(`${BASE}/api/media`, {
  method: 'POST',
  headers: { cookie: studentCookie },
  body: studentUploadForm,
});
assert.equal(studentUploadRes.status, 403, 'Student upload blocked with 403');
console.log('  ✓ Student uploading media correctly blocked with HTTP 403');

console.log('--- Step 3: Mandatory Alt Text Validation (WCAG AA) ---');
// Uploading image without alt_text must return 422 Unprocessable Entity
const noAltForm = new FormData();
// 1x1 transparent PNG
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
noAltForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'dot.png');
noAltForm.append('alt_text', '');

const noAltRes = await fetch(`${BASE}/api/media`, {
  method: 'POST',
  headers: { cookie: adminCookie },
  body: noAltForm,
});
assert.equal(noAltRes.status, 422, 'Upload without alt_text rejected with 422');
console.log('  ✓ Missing alt_text correctly rejected with HTTP 422');

console.log('--- Step 4: Valid Upload by Admin ---');
const validForm = new FormData();
validForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'dot-test.png');
validForm.append('alt_text', 'A test pixel for Balodaya Media Verification');
validForm.append('caption', 'Pixel demonstration test');
validForm.append('folder', 'testing');

const uploadRes = await fetch(`${BASE}/api/media`, {
  method: 'POST',
  headers: { cookie: adminCookie },
  body: validForm,
});
assert.equal(uploadRes.status, 201, 'Upload succeeded with 201');
const uploadedMedia = await uploadRes.json();
assert.ok(uploadedMedia.id, 'Uploaded item returned an id');
assert.equal(uploadedMedia.alt_text, 'A test pixel for Balodaya Media Verification');
console.log(`  ✓ Uploaded media ID #${uploadedMedia.id} (${uploadedMedia.file_path})`);

console.log('--- Step 5: Metadata Update & Focal Point ---');
const patchRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    cookie: adminCookie,
  },
  body: JSON.stringify({
    alt_text: 'Updated accessible description for test pixel',
    focal_x: 0.75,
    focal_y: 0.25,
    folder: 'verified',
  }),
});
assert.equal(patchRes.status, 200, 'Patch returned HTTP 200');
const patchedMedia = await patchRes.json();
assert.equal(patchedMedia.alt_text, 'Updated accessible description for test pixel');
assert.equal(patchedMedia.focal_x, 0.75);
console.log('  ✓ Metadata & focal coordinates updated successfully');

console.log('--- Step 6: Replace in Place ---');
const replaceForm = new FormData();
replaceForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'replaced-pixel.png');

const replaceRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}/replace`, {
  method: 'POST',
  headers: { cookie: adminCookie },
  body: replaceForm,
});
assert.equal(replaceRes.status, 200, 'Replace returned HTTP 200');
const replacedMedia = await replaceRes.json();
assert.equal(replacedMedia.id, uploadedMedia.id, 'Media ID preserved during in-place replacement');
console.log(`  ✓ File replaced in-place while preserving media ID #${replacedMedia.id}`);

console.log('--- Step 7: Usage Tracking & Delete Protection ---');
// Let's verify usage endpoint
const usageRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}/usage`, {
  headers: { cookie: adminCookie },
});
assert.equal(usageRes.status, 200, 'Usage tracking returned HTTP 200');
const usageData = await usageRes.json();
assert.equal(usageData.count, 0, 'No references initially');

// Now simulate a reference in school_settings
const { run } = await import('../../src/server/db.ts');
await run(
  "INSERT INTO school_settings (key, value) VALUES ('test_banner_media', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  [String(uploadedMedia.id)]
);

// Try to delete: must be blocked with HTTP 409
const deleteBlockedRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}`, {
  method: 'DELETE',
  headers: { cookie: adminCookie },
});
assert.equal(deleteBlockedRes.status, 409, 'Deletion blocked when in use (HTTP 409)');
console.log('  ✓ Deletion blocked with HTTP 409 when media is referenced by site settings');

// Clean up reference
await run("DELETE FROM school_settings WHERE key = 'test_banner_media'");

// Delete again: should succeed
const deleteOkRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}`, {
  method: 'DELETE',
  headers: { cookie: adminCookie },
});
assert.equal(deleteOkRes.status, 200, 'Soft delete succeeded');
console.log('  ✓ Media deleted successfully once references were removed');

// Verify deleted item is no longer returned in active list
const checkRes = await fetch(`${BASE}/api/media/${uploadedMedia.id}`);
assert.equal(checkRes.status, 404, 'Deleted item returns 404');
console.log('  ✓ Deleted item verified absent from public API');

console.log('\n========================================================');
console.log('ALL MEDIA SCENARIO ASSERTIONS PASSED! ✓');
console.log('========================================================');
process.exit(0);
