import assert from 'node:assert/strict';
import {
  todayNPT,
  nowNPT,
  parseYMD,
  formatYMD,
  addDays,
  dayOfWeek,
  dayName,
  eachDay,
  isWorkingDay,
  workingDaysBetween,
  toBS,
  formatBS,
  academicMonthLabel,
} from '../src/lib/calendar.ts';

console.log('Testing Balodaya Calendar Engine (src/lib/calendar.ts)...');

// 1. Basic parsing and formatting
assert.deepEqual(parseYMD('2026-10-12'), { y: 2026, m: 10, d: 12 });
assert.equal(formatYMD(2026, 4, 14), '2026-04-14');

// 2. Day of week (0=Sunday .. 6=Saturday)
assert.equal(dayOfWeek('2026-10-11'), 0, '2026-10-11 is Sunday (0)');
assert.equal(dayName(0), 'Sunday');
assert.equal(dayOfWeek('2026-10-12'), 1, '2026-10-12 is Monday (1)');
assert.equal(dayName(1), 'Monday');
assert.equal(dayOfWeek('2026-10-17'), 6, '2026-10-17 is Saturday (6)');
assert.equal(dayName(6), 'Saturday');

// 3. Date arithmetic
assert.equal(addDays('2026-02-28', 1), '2026-03-01', 'Non-leap year day rollover');
assert.equal(addDays('2024-02-28', 1), '2024-02-29', 'Leap year day rollover');
assert.equal(addDays('2026-12-31', 1), '2027-01-01', 'Year rollover');
assert.equal(addDays('2026-10-12', -2), '2026-10-10', 'Subtract days');

// 4. Date ranges
const span = eachDay('2026-10-10', '2026-10-13');
assert.deepEqual(span, ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);

// 5. Working day logic with Saturday off (default)
const ctxSatOff = {
  weeklyOff: [6], // Saturday off
  holidays: new Set(['2026-10-14']), // Wednesday holiday
};
assert.equal(isWorkingDay('2026-10-11', ctxSatOff), true, 'Sunday is a working day when only Saturday is off');
assert.equal(isWorkingDay('2026-10-17', ctxSatOff), false, 'Saturday is NOT a working day');
assert.equal(isWorkingDay('2026-10-14', ctxSatOff), false, 'Holiday is NOT a working day');
assert.equal(isWorkingDay('2026-10-15', ctxSatOff), true, 'Thursday is a working day');

// 6. Working day logic with Sunday off (admin configured)
const ctxSunOff = {
  weeklyOff: [0], // Sunday off
  holidays: new Set(['2026-10-14']),
};
assert.equal(isWorkingDay('2026-10-11', ctxSunOff), false, 'Sunday is NOT a working day when Sunday is off');
assert.equal(isWorkingDay('2026-10-17', ctxSunOff), true, 'Saturday is a working day when Sunday is off');

// 7. Working days count between dates
// 2026-10-11 (Sun) to 2026-10-18 (Sun): 8 total days
// If Sat (Oct 17) is off and Oct 14 is holiday:
// Days: 11(Sun=work), 12(Mon=work), 13(Tue=work), 14(Wed=hol), 15(Thu=work), 16(Fri=work), 17(Sat=off), 18(Sun=work)
// Working days = 6
const workCount = workingDaysBetween('2026-10-11', '2026-10-18', ctxSatOff);
assert.equal(workCount, 6, `Expected 6 working days, got ${workCount}`);

// 8. Nepali Bikram Sambat conversion
const bs = toBS('2026-10-12');
assert.equal(bs.year, 2083);
assert.equal(bs.monthName, 'Ashwin');
console.log('✓ Bikram Sambat representation for 2026-10-12:', formatBS('2026-10-12'));
console.log('✓ Nepali language representation:', formatBS('2026-10-12', { lang: 'ne', includeDayOfWeek: true }));

// 9. Nepal Time string
const today = todayNPT();
assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
console.log('✓ Current Nepal date (NPT):', today);

console.log('\nAll calendar engine tests passed successfully! ✓');
