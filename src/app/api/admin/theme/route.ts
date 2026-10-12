import { requireUser } from '@/server/guard';
import { handle, json, HttpError } from '@/server/http';
import { canServer } from '@/server/permissions';
import { getThemeConfig, saveThemeConfig, resetThemeConfig, getContrastRatio } from '@/server/theme';

export const GET = handle(async () => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'theme.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: theme.manage required');
  }

  const theme = await getThemeConfig();
  const contrastWithWhite = getContrastRatio(theme.primaryColor, '#ffffff');

  return json({
    theme,
    contrastRatio: Number(contrastWithWhite.toFixed(2)),
    passesAA: contrastWithWhite >= 3.0,
  });
});

export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'theme.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: theme.manage required');
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Invalid request body');
  }

  const updated = await saveThemeConfig(body, user.id);
  const contrastWithWhite = getContrastRatio(updated.primaryColor, '#ffffff');

  return json({
    theme: updated,
    contrastRatio: Number(contrastWithWhite.toFixed(2)),
    passesAA: contrastWithWhite >= 3.0,
    message: 'Theme colors and branding saved live.',
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const allowed = await canServer(user.role, 'theme.manage');
  if (!allowed) {
    throw new HttpError(403, 'Permission denied: theme.manage required');
  }

  const body = await req.json().catch(() => null);
  if (body?.action === 'reset') {
    const reset = await resetThemeConfig(user.id);
    return json({
      theme: reset,
      message: 'Theme successfully reset to Balodaya Himalayan default.',
    });
  }

  const updated = await saveThemeConfig(body || {}, user.id);
  const contrastWithWhite = getContrastRatio(updated.primaryColor, '#ffffff');

  return json({
    theme: updated,
    contrastRatio: Number(contrastWithWhite.toFixed(2)),
    passesAA: contrastWithWhite >= 3.0,
    message: 'Theme colors and branding saved live.',
  });
});
