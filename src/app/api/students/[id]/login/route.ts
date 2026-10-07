import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/server/guard';
import { one, run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request, context?: { params: Promise<{ id: string }> }) => {
  await requireRole('admin', 'principal');
  const params = await context?.params;
  const studentId = parseInt(params?.id || '', 10);
  if (isNaN(studentId)) throw new HttpError(400, 'Invalid student ID.');

  const student = await one<{
    id: number;
    admission_no: string;
    full_name: string;
    user_id: number | null;
  }>('SELECT id, admission_no, full_name, user_id FROM students WHERE id = ?', [studentId]);

  if (!student) throw new HttpError(404, 'Student not found.');
  if (student.user_id) throw new HttpError(409, 'Student already has a user account.');

  const body = await req.json().catch(() => ({}));
  const email = (
    body.email || `${student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '')}@balodaya.edu.np`
  ).trim();

  // Temporary password
  const tempPassword = `Balodaya${crypto.randomBytes(3).toString('hex')}!`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Check email uniqueness
  const existingUser = await one('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser) {
    throw new HttpError(409, 'A user account with this email already exists.');
  }

  const userRes = await run(
    `INSERT INTO users (email, password_hash, name, role, active, must_change_password)
     VALUES (?, ?, ?, 'student', 1, 1)`,
    [email, passwordHash, student.full_name]
  );
  const userId = Number(userRes.lastInsertRowid);

  await run('UPDATE students SET user_id = ? WHERE id = ?', [userId, studentId]);

  return json({
    userId,
    email,
    tempPassword,
  });
});
