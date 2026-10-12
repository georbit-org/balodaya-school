'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import type { ThemeConfig } from '@/server/theme';
import styles from './page.module.css';

export default function ThemeCustomizerPage() {
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#0284c7',
    accentColor: '#0a2540',
    headerColor: '#0a2540',
    buttonRadius: '6px',
    density: 'comfortable',
    darkSidebar: false,
    fontHeading: 'Newsreader',
    fontBody: 'Hanken Grotesk',
  });
  const [contrastRatio, setContrastRatio] = useState<number>(4.8);
  const [passesAA, setPassesAA] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTheme = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/theme');
      if (!res.ok) throw new Error('Failed to load theme configuration');
      const data = await res.json();
      setTheme(data.theme);
      setContrastRatio(data.contrastRatio);
      setPassesAA(data.passesAA);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading theme.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save theme');
      }

      setContrastRatio(data.contrastRatio);
      setPassesAA(data.passesAA);
      setStatusMsg({ type: 'success', text: 'Theme colors and typography saved live!' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all colors and typography to Balodaya Himalayan Sky Blue default?')) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setTheme(data.theme);
      setStatusMsg({ type: 'success', text: 'Theme successfully reset to defaults.' });
      fetchTheme();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Reset failed',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Theme & Visual Branding"
        description="Live brand control for primary colours, top navigation bar, typography, and button corner curvature. Changes apply instantly across the entire portal with built-in WCAG AA contrast enforcement."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/app/site/identity" className="button secondary" style={{ textDecoration: 'none' }}>
              Identity & Logo
            </Link>
            <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
              ← Settings
            </Link>
          </div>
        }
      />

      {statusMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className={styles.layoutGrid}>
        {/* Controls Column */}
        <div className={styles.card}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Brand Palette</h3>

          <div className={styles.fieldGroup}>
            <label>Primary Brand Sky/Blue (Buttons & Badges)</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorPicker}
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
              />
              <input
                type="text"
                className={styles.hexInput}
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
              />
              <span
                className={styles.contrastBadge}
                style={{
                  background: passesAA ? '#dcfce7' : '#fee2e2',
                  color: passesAA ? '#15803d' : '#991b1b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon name={passesAA ? 'check' : 'alert-triangle'} size={12} />
                <span>{passesAA ? `AA Contrast (${contrastRatio}:1)` : `Low Contrast (${contrastRatio}:1)`}</span>
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Accent Dark Navy (Headings & Footers)</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorPicker}
                value={theme.accentColor}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
              />
              <input
                type="text"
                className={styles.hexInput}
                value={theme.accentColor}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Header Navigation Bar Background</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorPicker}
                value={theme.headerColor}
                onChange={(e) => setTheme({ ...theme, headerColor: e.target.value })}
              />
              <input
                type="text"
                className={styles.hexInput}
                value={theme.headerColor}
                onChange={(e) => setTheme({ ...theme, headerColor: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ margin: '14px 0 6px 0', fontSize: '1rem' }}>Typography & Geometry</h3>

          <div className={styles.fieldGroup}>
            <label>Heading Font Family</label>
            <select
              className={styles.select}
              value={theme.fontHeading}
              onChange={(e) => setTheme({ ...theme, fontHeading: e.target.value })}
            >
              <option value="Newsreader">Newsreader (Editorial Serif - Default)</option>
              <option value="Inter">Inter (Clean Modern Sans)</option>
              <option value="Cinzel">Cinzel (Classical Elegant Serif)</option>
              <option value="Outfit">Outfit (Contemporary Geometric Sans)</option>
              <option value="Merriweather">Merriweather (Traditional Academic Serif)</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Body Font Family</label>
            <select
              className={styles.select}
              value={theme.fontBody}
              onChange={(e) => setTheme({ ...theme, fontBody: e.target.value })}
            >
              <option value="Hanken Grotesk">Hanken Grotesk (Humanist Sans - Default)</option>
              <option value="Inter">Inter (High-legibility UI Sans)</option>
              <option value="Roboto">Roboto (Neutral Clean Sans)</option>
              <option value="Outfit">Outfit (Display Geometric Sans)</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Button Corner Curvature</label>
            <select
              className={styles.select}
              value={theme.buttonRadius}
              onChange={(e) => setTheme({ ...theme, buttonRadius: e.target.value })}
            >
              <option value="2px">Sharp (2px)</option>
              <option value="4px">Subtle (4px)</option>
              <option value="6px">Balanced (6px - Default)</option>
              <option value="8px">Curved (8px)</option>
              <option value="9999px">Pill / Rounded Full</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <Button variant="secondary" onClick={handleReset} disabled={saving}>
              Reset to Balodaya Default
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save Theme'}
            </Button>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className={styles.card}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Live Theme Preview</h3>
          <div className={styles.previewCanvas}>
            {/* Header Preview */}
            <div
              className={styles.previewHeader}
              style={{ backgroundColor: theme.headerColor }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Balodaya Secondary School</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Bheerkot-06, Syangja</div>
            </div>

            {/* Typography Preview */}
            <div>
              <h2
                style={{
                  margin: '4px 0',
                  color: theme.accentColor,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  fontFamily: theme.fontHeading,
                }}
              >
                Nurturing Excellence in Gandaki
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#475569',
                  fontFamily: theme.fontBody,
                  lineHeight: 1.5,
                }}
              >
                Welcome to our student portal. Preview how action buttons, cards, and headings appear with your selected styling.
              </p>
            </div>

            {/* Buttons Preview */}
            <div className={styles.buttonRow}>
              <button
                type="button"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: theme.buttonRadius,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Primary Action Button
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: '#ffffff',
                  color: theme.accentColor,
                  border: `1px solid ${theme.primaryColor}`,
                  padding: '8px 16px',
                  borderRadius: theme.buttonRadius,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Outlined Secondary
              </button>
            </div>

            {/* Component Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: theme.buttonRadius,
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.8125rem', color: theme.accentColor }}>
                  Term 1 Examination Schedule
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Starting Kartik 12, 2083</div>
              </div>
              <span
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                  border: `1px solid ${theme.primaryColor}40`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
