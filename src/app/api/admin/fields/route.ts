import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import {
  listLookups,
  saveLookup,
  deleteLookup,
  listCustomFields,
  saveCustomField,
  deleteCustomField,
} from '@/server/fields';

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'all';
  const kind = url.searchParams.get('kind') || undefined;
  const entity = url.searchParams.get('entity') || undefined;

  const [lookupsAllowed, fieldsAllowed] = await Promise.all([
    canServer(user.role, 'lookups.manage'),
    canServer(user.role, 'custom_fields.manage'),
  ]);

  if (!lookupsAllowed && !fieldsAllowed) {
    throw new HttpError(403, 'Permission denied to manage lookups or custom fields');
  }

  if (type === 'lookups') {
    const lookups = await listLookups(kind);
    return json({ lookups });
  }

  if (type === 'custom_fields') {
    const fields = await listCustomFields(entity);
    return json({ fields });
  }

  const [lookups, fields] = await Promise.all([
    listLookups(),
    listCustomFields(),
  ]);

  return json({ lookups, fields });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Invalid request body');
  }

  const target = body.target; // 'lookup' | 'custom_field'

  if (target === 'lookup') {
    const allowed = await canServer(user.role, 'lookups.manage');
    if (!allowed) throw new HttpError(403, 'Permission denied: lookups.manage required');
    const saved = await saveLookup(body.data, user.id);
    return json({ lookup: saved });
  }

  if (target === 'custom_field') {
    const allowed = await canServer(user.role, 'custom_fields.manage');
    if (!allowed) throw new HttpError(403, 'Permission denied: custom_fields.manage required');
    const saved = await saveCustomField(body.data, user.id);
    return json({ field: saved });
  }

  throw new HttpError(400, 'Invalid target specified (must be "lookup" or "custom_field")');
});

export const DELETE = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const target = url.searchParams.get('target');
  const idStr = url.searchParams.get('id');

  if (!target || !idStr) {
    throw new HttpError(400, 'target and id query parameters are required');
  }

  const id = Number(idStr);
  if (isNaN(id) || id <= 0) {
    throw new HttpError(400, 'Valid numeric id is required');
  }

  if (target === 'lookup') {
    const allowed = await canServer(user.role, 'lookups.manage');
    if (!allowed) throw new HttpError(403, 'Permission denied: lookups.manage required');
    await deleteLookup(id, user.id);
    return json({ message: 'Lookup item deleted successfully' });
  }

  if (target === 'custom_field') {
    const allowed = await canServer(user.role, 'custom_fields.manage');
    if (!allowed) throw new HttpError(403, 'Permission denied: custom_fields.manage required');
    await deleteCustomField(id, user.id);
    return json({ message: 'Custom field deleted successfully' });
  }

  throw new HttpError(400, 'Invalid target specified');
});
