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

  const body = await req.json().catch(() => ({}));
  const { name, relation, phone, email, create_login } = body;

  if (!name || !phone) {
    throw new HttpError(400, 'Guardian name and phone number are required.');
  }

  let userId: number | null = null;
  let tempPassword = '';

  if (create_login) {
    if (!email) throw new HttpError(400, 'An email address is required to create a parent login.');
    const cleanEmail = email.trim();
    const existingUser = await one<{ id: number }>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      userId = existingUser.id;
    } else {
      tempPassword = `Balodaya${crypto.randomBytes(3).toString('hex')}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const userRes = await run(
        `INSERT INTO users (email, password_hash, name, phone, role, active, must_change_password)
         VALUES (?, ?, ?, ?, 'parent', 1, 1)`,
        [cleanEmail, passwordHash, name.trim(), phone.trim()]
      );
      userId = Number(userRes.lastInsertRowid);
    }
  }

  const res = await run(
    `INSERT INTO student_guardians (student_id, user_id, name, relation, phone, email, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [studentId, userId, name.trim(), relation || 'Guardian', phone.trim(), email || null]
  );

  return json({
    guardianId: Number(res.lastInsertRowid),
    userId,
    tempPassword: tempPassword || null,
  }, 201);
});
