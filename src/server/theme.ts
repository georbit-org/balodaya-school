import { getSetting, setSetting } from '@/server/settings';
import { audit } from '@/server/audit';
import { HttpError } from '@/server/http';

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  headerColor: string;
  buttonRadius: string;
  density: 'comfortable' | 'compact';
  darkSidebar: boolean;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#0284c7',
  accentColor: '#0a2540',
  headerColor: '#0a2540',
  buttonRadius: '6px',
  density: 'comfortable',
  darkSidebar: false,
  fontHeading: 'Newsreader',
  fontBody: 'Hanken Grotesk',
};

// Helper to calculate relative luminance
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export async function getThemeConfig(): Promise<ThemeConfig> {
  try {
    const primary = (await getSetting('theme_primary_color')) || DEFAULT_THEME.primaryColor;
    const accent = (await getSetting('theme_accent_color')) || DEFAULT_THEME.accentColor;
    const header = (await getSetting('theme_header_color')) || DEFAULT_THEME.headerColor;
    const radius = (await getSetting('theme_button_radius')) || DEFAULT_THEME.buttonRadius;
    const density = ((await getSetting('theme_density')) as 'comfortable' | 'compact') || DEFAULT_THEME.density;
    const darkSidebar = (await getSetting('theme_sidebar_dark')) === 'true';
    const fontHeading = (await getSetting('theme_font_heading')) || DEFAULT_THEME.fontHeading;
    const fontBody = (await getSetting('theme_font_body')) || DEFAULT_THEME.fontBody;

    return {
      primaryColor: primary,
      accentColor: accent,
      headerColor: header,
      buttonRadius: radius,
      density,
      darkSidebar,
      fontHeading,
      fontBody,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export async function saveThemeConfig(config: Partial<ThemeConfig>, userId: number): Promise<ThemeConfig> {
  // WCAG AA contrast check: Primary color with white text must have >= 3.0:1 (for UI components) and >= 4.5:1 (for text)
  if (config.primaryColor) {
    const contrastWithWhite = getContrastRatio(config.primaryColor, '#ffffff');
    if (contrastWithWhite < 3.0) {
      throw new HttpError(
        422,
        `Primary color (${config.primaryColor}) fails WCAG AA contrast with white text (ratio ${contrastWithWhite.toFixed(1)}:1 < 3.0:1). Please choose a slightly darker shade for legibility.`
      );
    }
  }

  if (config.accentColor) {
    const contrastWithWhite = getContrastRatio(config.accentColor, '#ffffff');
    if (contrastWithWhite < 3.0) {
      throw new HttpError(
        422,
        `Accent color (${config.accentColor}) fails WCAG contrast ratio (${contrastWithWhite.toFixed(1)}:1 < 3.0:1). Please choose a darker tone.`
      );
    }
  }

  if (config.primaryColor) await setSetting('theme_primary_color', config.primaryColor, userId, 'Theme customization');
  if (config.accentColor) await setSetting('theme_accent_color', config.accentColor, userId, 'Theme customization');
  if (config.headerColor) await setSetting('theme_header_color', config.headerColor, userId, 'Theme customization');
  if (config.buttonRadius) await setSetting('theme_button_radius', config.buttonRadius, userId, 'Theme customization');
  if (config.density) await setSetting('theme_density', config.density, userId, 'Theme customization');
  if (config.darkSidebar !== undefined) await setSetting('theme_sidebar_dark', config.darkSidebar ? 'true' : 'false', userId, 'Theme customization');
  if (config.fontHeading) await setSetting('theme_font_heading', config.fontHeading, userId, 'Theme customization');
  if (config.fontBody) await setSetting('theme_font_body', config.fontBody, userId, 'Theme customization');

  await audit(userId, 'update_theme', 'settings', null, config);

  return getThemeConfig();
}

export async function resetThemeConfig(userId: number): Promise<ThemeConfig> {
  return saveThemeConfig(DEFAULT_THEME, userId);
}

export function generateThemeCss(theme: ThemeConfig): string {
  return `
:root {
  --color-primary: ${theme.primaryColor};
  --color-navy: ${theme.headerColor};
  --color-accent: ${theme.accentColor};
  --radius-md: ${theme.buttonRadius};
  ${theme.density === 'compact' ? '--spacing-scale: 0.85;' : ''}
}
${theme.darkSidebar ? `
[data-sidebar="app"] {
  --sidebar-bg: #0b1329 !important;
  --sidebar-text: #f8fafc !important;
}
` : ''}
`.trim();
}
