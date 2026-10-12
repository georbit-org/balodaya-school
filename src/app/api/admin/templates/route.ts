import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import { listTemplates, updateTemplate, renderTemplateText } from '@/server/templates';

export const GET = handle(async () => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'templates.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: templates.manage required');
  }

  const templates = await listTemplates();
  return json(templates);
});

export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'templates.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: templates.manage required');
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || !body.key || !body.body_en) {
    throw new HttpError(400, 'Template "key" and "body_en" are required.');
  }

  const updated = await updateTemplate(
    body.key,
    {
      kind: body.kind,
      subject: body.subject,
      body_en: body.body_en,
      body_ne: body.body_ne,
    },
    user.id
  );

  return json(updated);
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'templates.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: templates.manage required');
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Invalid request body.');
  }

  // Preview action
  if (body.action === 'preview') {
    const text = body.text || '';
    const sampleVars: Record<string, string | number> = {
      student: 'Aarav Shrestha',
      class: 'Class 9-A',
      roll: 12,
      year: '2083',
      guardian: 'Ram Shrestha',
      amount: '4,500',
      date: '2083-07-15',
      from_date: '2083-07-10',
      to_date: '2083-07-12',
      due_date: '2083-07-30',
      name: 'Sunita Sharma',
      username: 'sunita.teacher',
      receipt_no: 'RCP-2083-00124',
    };
    const rendered = renderTemplateText(text, sampleVars);
    return json({ preview: rendered });
  }

  if (!body.key || !body.body_en) {
    throw new HttpError(400, 'Template "key" and "body_en" are required.');
  }

  const updated = await updateTemplate(
    body.key,
    {
      kind: body.kind,
      subject: body.subject,
      body_en: body.body_en,
      body_ne: body.body_ne,
    },
    user.id
  );

  return json(updated);
});
