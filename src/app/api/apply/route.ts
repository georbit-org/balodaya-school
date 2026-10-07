import { one, run } from '@/server/db';
import { handle, json, HttpError, checkRateLimit } from '@/server/http';

export const POST = handle(async (req: Request) => {
  if (!checkRateLimit(req)) {
    throw new HttpError(429, 'Too many requests. Please wait a moment.');
  }

  const body = await req.json().catch(() => ({}));
  const {
    studentName,
    dob,
    gender = null,
    classApplying,
    guardianName,
    guardianPhone,
    guardianEmail = null,
    address = null,
    previousSchool = null,
    notes = null,
    website = '',
  } = body;

  // Honeypot check
  if (website) {
    throw new HttpError(400, 'Invalid submission.');
  }

  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    throw new HttpError(400, 'Student full name is required (minimum 2 characters).');
  }

  if (!dob) {
    throw new HttpError(400, 'Date of birth is required.');
  }

  if (!classApplying) {
    throw new HttpError(400, 'Class applying for is required.');
  }

  if (!guardianName || typeof guardianName !== 'string' || !guardianName.trim()) {
    throw new HttpError(400, 'Parent or guardian name is required.');
  }

  const cleanPhone = (guardianPhone || '').replace(/\D/g, '');
  if (cleanPhone.length < 9 || cleanPhone.length > 15) {
    throw new HttpError(400, 'A valid guardian phone number is required (9 to 15 digits).');
  }

  // Get current academic year name
  const currentYear = await one<{ name: string }>(
    'SELECT name FROM academic_years WHERE is_current = 1'
  );
  const yearName = currentYear ? currentYear.name : '2083';

  // Get next sequence number inside transaction
  const countRow = await one<{ count: number }>(
    'SELECT count(*) as count FROM applications WHERE reference LIKE ?',
    [`APP-${yearName}-%`]
  );
  const nextSeq = (countRow ? countRow.count : 0) + 1;
  const reference = `APP-${yearName}-${String(nextSeq).padStart(5, '0')}`;

  const res = await run(
    `INSERT INTO applications (
      reference, student_name, dob, gender, class_applying,
      guardian_name, guardian_phone, guardian_email,
      address, previous_school, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    [
      reference,
      studentName.trim(),
      dob,
      gender || null,
      classApplying,
      guardianName.trim(),
      cleanPhone,
      guardianEmail || null,
      address || null,
      previousSchool || null,
      notes || null,
    ]
  );

  return json(
    {
      id: Number(res.lastInsertRowid),
      reference,
      message: 'Application submitted successfully.',
    },
    201
  );
});
