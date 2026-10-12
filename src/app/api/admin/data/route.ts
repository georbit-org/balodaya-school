import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import { listBackups, createBackup, restoreBackup, exportModule } from '@/server/backup';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'backup.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: backup.manage required');
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'export') {
    const moduleName = url.searchParams.get('module') || 'students';
    const format = (url.searchParams.get('format') || 'csv') as 'csv' | 'json';
    const result = await exportModule(moduleName, format);

    return new Response(result.content, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  }

  const backups = await listBackups();
  return json({ backups });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'backup.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: backup.manage required');
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Invalid request body');
  }

  if (body.action === 'create_backup') {
    const backup = await createBackup(user.id);
    return json({
      backup,
      message: `Database backup ${backup.filename} created successfully.`,
    });
  }

  if (body.action === 'restore_backup') {
    if (!body.filename || !body.confirmation) {
      throw new HttpError(400, 'filename and confirmation phrase are required');
    }

    await restoreBackup(body.filename, body.confirmation, user.id);
    return json({
      message: `Database successfully restored from ${body.filename}.`,
    });
  }

  throw new HttpError(400, 'Invalid action specified');
});
