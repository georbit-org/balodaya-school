import assert from 'node:assert/strict';
import { can, PERMISSIONS, ALL_ROLES } from '../src/lib/permissions.ts';

console.log('Testing Balodaya SMS Permission Matrix...\n');

// 1. Structural checks
assert.ok(ALL_ROLES.length === 6, 'Must define all 6 roles');
assert.ok(Object.keys(PERMISSIONS).length > 20, 'Permissions dictionary must define all actions');

// 2. Real-life core assertions
console.log('Asserting real-life rules:');

// Rule 1: Student & Parent apply for leave, NEVER review/approve
assert.equal(can('student', 'leave.apply'), true, 'Student can apply for leave');
assert.equal(can('parent', 'leave.apply'), true, 'Parent can apply for leave');
assert.equal(can('student', 'leave.review'), false, 'Student MUST NOT review/approve leave');
assert.equal(can('parent', 'leave.review'), false, 'Parent MUST NOT review/approve leave');
assert.equal(can('teacher', 'leave.review'), true, 'Teacher can review leave');
assert.equal(can('principal', 'leave.review'), true, 'Principal can review leave');
assert.equal(can('admin', 'leave.review'), true, 'Admin can review leave');
assert.equal(can('accountant', 'leave.review'), false, 'Accountant cannot review leave');
console.log('  ✓ Leave applications & reviews strictly separated');

// Rule 2: Parent & Student NEVER enter marks
assert.equal(can('student', 'marks.enter'), false, 'Student MUST NOT enter marks');
assert.equal(can('parent', 'marks.enter'), false, 'Parent MUST NOT enter marks');
assert.equal(can('accountant', 'marks.enter'), false, 'Accountant MUST NOT enter marks');
assert.equal(can('teacher', 'marks.enter'), true, 'Teacher can enter marks');
assert.equal(can('principal', 'marks.enter'), true, 'Principal can enter marks');
assert.equal(can('admin', 'marks.enter'), true, 'Admin can enter marks');
console.log('  ✓ Marks entry restricted to teachers and administrators');

// Rule 3: Only Principal & Admin can publish marks or manage exams
assert.equal(can('teacher', 'marks.publish'), false, 'Teacher cannot publish marks');
assert.equal(can('accountant', 'marks.publish'), false, 'Accountant cannot publish marks');
assert.equal(can('parent', 'marks.publish'), false, 'Parent cannot publish marks');
assert.equal(can('student', 'marks.publish'), false, 'Student cannot publish marks');
assert.equal(can('principal', 'marks.publish'), true, 'Principal can publish marks');
assert.equal(can('admin', 'marks.publish'), true, 'Admin can publish marks');
console.log('  ✓ Publishing marks restricted to Principal & Admin');

// Rule 4: Fee record restricted to Accountant & Admin
assert.equal(can('accountant', 'fee.record'), true, 'Accountant can record payments');
assert.equal(can('admin', 'fee.record'), true, 'Admin can record payments');
assert.equal(can('teacher', 'fee.record'), false, 'Teacher MUST NOT record fee payments');
assert.equal(can('student', 'fee.record'), false, 'Student MUST NOT record fee payments');
assert.equal(can('parent', 'fee.record'), false, 'Parent MUST NOT record fee payments');
console.log('  ✓ Fee collection restricted to Accountant & Admin');

// Rule 5: Student creation restricted to Admin & Principal
assert.equal(can('admin', 'student.create'), true, 'Admin can create students');
assert.equal(can('principal', 'student.create'), true, 'Principal can create students');
assert.equal(can('teacher', 'student.create'), false, 'Teacher cannot create student accounts');
assert.equal(can('accountant', 'student.create'), false, 'Accountant cannot create student accounts');
assert.equal(can('student', 'student.create'), false, 'Student cannot create students');
assert.equal(can('parent', 'student.create'), false, 'Parent cannot create students');
console.log('  ✓ Student creation restricted to Admin & Principal');

// Rule 6: User management strictly Admin only
assert.equal(can('admin', 'user.manage'), true, 'Admin can manage system users');
assert.equal(can('principal', 'user.manage'), false, 'Principal cannot manage system user logins');
assert.equal(can('teacher', 'user.manage'), false, 'Teacher cannot manage system users');
console.log('  ✓ User account management is strictly Admin only');

// 3. Exhaustive check of PERMISSIONS table consistency
for (const [action, allowedRoles] of Object.entries(PERMISSIONS)) {
  for (const role of ALL_ROLES) {
    const expected = allowedRoles.includes(role);
    const actual = can(role, action);
    assert.equal(
      actual,
      expected,
      `Mismatch for role "${role}" on action "${action}": expected ${expected}, got ${actual}`
    );
  }
}

console.log('\nAll permission matrix assertions passed successfully!');
