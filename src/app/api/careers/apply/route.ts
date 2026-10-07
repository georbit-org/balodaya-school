import fs from 'fs';
import path from 'path';
import { run } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const POST = handle(async (req: Request) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) throw new HttpError(400, 'Invalid submission.');

  // Honeypot check
  const website = formData.get('website') as string | null;
  if (website) {
    // Honeypot triggered: silently pretend success to bots
    return json({ ok: true, reference: 'APP-SUBMITTED' });
  }

  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const message = (formData.get('message') as string)?.trim() || null;
  const vacancyId = formData.get('vacancy_id') ? parseInt(formData.get('vacancy_id') as string, 10) : null;

  if (!name || !phone) {
    throw new HttpError(400, 'Candidate full name and phone number are required.');
  }

  // Handle CV file upload
  let cvPath: string | null = null;
  const file = formData.get('cv') as File | null;
  if (file && file.size > 0) {
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `cv-${Date.now()}-${cleanName}`;
    const diskPath = path.join(uploadsDir, uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(diskPath, Buffer.from(arrayBuffer));
    cvPath = `data/uploads/${uniqueName}`;
  }

  const res = await run(
    `INSERT INTO job_applications (vacancy_id, name, phone, email, message, cv_path, status)
     VALUES (?, ?, ?, ?, ?, ?, 'new')`,
    [vacancyId, name, phone, email, message, cvPath]
  );

  return json({ ok: true, id: Number(res.lastInsertRowid) }, 201);
});
