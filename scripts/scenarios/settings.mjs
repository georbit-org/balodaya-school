import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

console.log('========================================================');
console.log('BALODAYA SETTINGS & ADMIN CONTROL CENTER SCENARIO TEST');
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

console.log('--- Step 1: Health Audit Engine ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/health`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student health check blocked');

  const adminRes = await fetch(`${BASE}/api/admin/health`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminRes.status, 200, 'Admin health check succeeded');
  const health = await adminRes.json();
  assert.ok(typeof health.score === 'number', 'Health check returns numeric score');
  assert.ok(Array.isArray(health.issues), 'Health check returns issues array');
  console.log(`  ✓ System Health Score: ${health.score}% with ${health.issues.length} detected issues`);
}

console.log('\n--- Step 2: Templates & Dynamic Placeholders ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/templates`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student template access blocked');

  // List templates
  const listRes = await fetch(`${BASE}/api/admin/templates`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(listRes.status, 200, 'Listing templates succeeded');
  const templates = await listRes.json();
  assert.ok(templates.length >= 4, 'Found at least 4 default templates');

  // Test placeholder preview
  const previewRes = await fetch(`${BASE}/api/admin/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      action: 'preview',
      text: 'Dear parent, {student} was absent on {date}. Fee due: {amount}.',
    }),
  });
  assert.equal(previewRes.status, 200, 'Template preview succeeded');
  const previewData = await previewRes.json();
  assert.ok(previewData.preview.includes('Aarav Shrestha'), 'Rendered student name placeholder');
  console.log(`  ✓ Template rendered successfully: "${previewData.preview}"`);

  // Update a template
  const putRes = await fetch(`${BASE}/api/admin/templates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      key: 'sms_absent',
      kind: 'sms',
      subject: 'Absent Notice',
      body_en: 'Balodaya Alert: {student} of {class} is absent on {date}. Contact school if unexpected.',
      body_ne: 'बालोदय सूचना: {student} आज {date} मा अनुपस्थित हुनुहुन्छ।',
    }),
  });
  assert.equal(putRes.status, 200, 'Updating template succeeded');
  console.log('  ✓ Updated "sms_absent" notification template');
}

console.log('\n--- Step 3: Lookups & Custom Fields Engine ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/fields`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student fields access blocked');

  // Create a custom lookup
  const lookupRes = await fetch(`${BASE}/api/admin/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      target: 'lookup',
      data: {
        kind: 'blood_group',
        code: 'A_NEG',
        label: 'A Negative (A-)',
        label_ne: 'ए नेगेटिभ',
        sort_order: 10,
      },
    }),
  });
  assert.equal(lookupRes.status, 200, 'Saving lookup succeeded');
  const savedLookup = await lookupRes.json();
  assert.equal(savedLookup.lookup.code, 'A_NEG');
  console.log('  ✓ Created lookup item "A_NEG"');

  // Create a custom field
  const fieldRes = await fetch(`${BASE}/api/admin/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      target: 'custom_field',
      data: {
        entity: 'student',
        key: 'emergency_contact_relation',
        label: 'Emergency Contact Relationship',
        label_ne: 'आपतकालीन सम्पर्क सम्बन्ध',
        type: 'text',
        required: 1,
        visible_roles: '["admin","teacher"]',
        sort_order: 1,
      },
    }),
  });
  assert.equal(fieldRes.status, 200, 'Saving custom field succeeded');
  const savedField = await fieldRes.json();
  assert.equal(savedField.field.key, 'emergency_contact_relation');
  console.log('  ✓ Created student custom field "emergency_contact_relation"');

  // Clean up test custom field
  const delFieldRes = await fetch(`${BASE}/api/admin/fields?target=custom_field&id=${savedField.field.id}`, {
    method: 'DELETE',
    headers: { cookie: adminCookie },
  });
  assert.equal(delFieldRes.status, 200, 'Deleting custom field succeeded');
  console.log('  ✓ Cleaned up test custom field');
}

console.log('\n--- Step 4: Approval Workflows & Versioning ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/workflows`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student workflow access blocked');

  const listRes = await fetch(`${BASE}/api/admin/workflows`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(listRes.status, 200, 'Listing workflows succeeded');
  const workflows = await listRes.json();
  assert.ok(workflows.length >= 2, 'Found student and staff leave workflows');

  const staffWf = workflows.find((w) => w.applies_to === 'staff_leave');
  assert.ok(staffWf, 'Found staff leave workflow');
  const initialVersion = staffWf.version;

  // Update staff leave workflow steps
  const putRes = await fetch(`${BASE}/api/admin/workflows`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      id: staffWf.id,
      active: 1,
      steps: [
        {
          step_no: 1,
          approver_kind: 'role',
          approver_value: 'principal',
          escalate_after_hours: 48,
          can_skip_if_unavailable: 0,
        },
      ],
    }),
  });
  assert.equal(putRes.status, 200, 'Updating workflow succeeded');
  const updatedWf = await putRes.json();
  assert.equal(updatedWf.version, initialVersion + 1, 'Workflow version incremented upon update');
  console.log(`  ✓ Updated staff workflow: version incremented from ${initialVersion} to ${updatedWf.version}`);
}

console.log('\n--- Step 5: Theme & WCAG Contrast Guard ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/theme`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student theme access blocked');

  // Try to submit an unreadable low-contrast primary color (e.g. yellow/white #fff080 on white)
  const invalidRes = await fetch(`${BASE}/api/admin/theme`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      primaryColor: '#ffff00', // yellow on white fails AA (contrast ~1.07)
      accentColor: '#10b981',
      sidebarDark: true,
      fontFamily: 'Hanken Grotesk',
      borderRadius: '8px',
      density: 'comfortable',
    }),
  });
  assert.equal(invalidRes.status, 422, 'Low contrast theme properly rejected with HTTP 422');
  const invalidJson = await invalidRes.json();
  assert.ok(invalidJson.error.includes('contrast'), 'Error message mentions contrast requirement');
  console.log(`  ✓ Contrast guard successfully blocked low contrast theme: "${invalidJson.error}"`);

  // Submit a valid theme
  const validRes = await fetch(`${BASE}/api/admin/theme`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      primaryColor: '#0284c7', // Balodaya Sky
      accentColor: '#0f766e',
      sidebarDark: true,
      fontFamily: 'Hanken Grotesk',
      borderRadius: '8px',
      density: 'comfortable',
    }),
  });
  assert.equal(validRes.status, 200, 'Valid theme saved successfully');
  const validJson = await validRes.json();
  assert.ok(validJson.passesAA, 'Theme passes WCAG AA');
  console.log(`  ✓ Valid theme saved with contrast ratio ${validJson.contrastRatio}:1 (passes AA)`);
}

console.log('\n--- Step 6: Data Vault & Backups ---');
{
  const studentRes = await fetch(`${BASE}/api/admin/data`, {
    headers: { cookie: studentCookie },
  });
  assert.equal(studentRes.status, 403, 'Student data vault access blocked');

  // Create an on-demand SQLite snapshot backup
  const createRes = await fetch(`${BASE}/api/admin/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ action: 'create_backup' }),
  });
  assert.equal(createRes.status, 200, 'Creating backup succeeded');
  const createJson = await createRes.json();
  assert.ok(createJson.backup.filename.includes('.db'), 'Backup generated with .db extension');
  console.log(`  ✓ Created database backup snapshot: ${createJson.backup.filename} (${createJson.backup.sizeBytes} bytes)`);

  // List backups
  const listRes = await fetch(`${BASE}/api/admin/data`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(listRes.status, 200, 'Listing backups succeeded');
  const listJson = await listRes.json();
  assert.ok(listJson.backups.length >= 1, 'Found at least 1 backup in vault');

  // Export module as CSV
  const exportCsvRes = await fetch(`${BASE}/api/admin/data?action=export&module=students&format=csv`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(exportCsvRes.status, 200, 'CSV export succeeded');
  const csvText = await exportCsvRes.text();
  assert.ok(csvText.includes('admission_no') || csvText.includes('id'), 'CSV export has student headers');
  console.log('  ✓ Exported "students" module to CSV');
}

console.log('\n--- Step 7: Feature Flags & Vocabulary Labels ---');
{
  // Feature flags
  const flagsRes = await fetch(`${BASE}/api/admin/feature-flags`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(flagsRes.status, 200, 'Listing feature flags succeeded');
  const flags = await flagsRes.json();
  assert.ok(flags.length >= 8, 'Found at least 8 feature flags');
  console.log(`  ✓ Found ${flags.length} modular feature flags`);

  // Vocabulary labels
  const labelsRes = await fetch(`${BASE}/api/admin/labels`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(labelsRes.status, 200, 'Listing vocabulary labels succeeded');
  const labels = await labelsRes.json();
  assert.ok(labels.length >= 10, 'Found at least 10 configurable UI labels');
  console.log(`  ✓ Found ${labels.length} dynamic UI vocabulary labels`);
}

console.log('\n========================================================');
console.log('PHASE D SETTINGS SUITE PASSED ALL CHECKS');
console.log('========================================================');
