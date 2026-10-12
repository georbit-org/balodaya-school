'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MediaPicker, MediaItem } from '@/components/media/MediaPicker';

export default function SiteIdentityAdminPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logo Media Picker
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings.');
      const data = await res.json();
      setSettings(data.settings || {});
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading identity settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdate = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSingle = async (key: string) => {
    setSavingKey(key);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: settings[key],
          reason: 'Updated via Site Identity Admin Center',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save setting');
      }

      setStatusMsg({ type: 'success', text: `Saved "${key}" successfully.` });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <PageHeader
        title="School Identity & Website Branding"
        description="Every phone number, motto, address, announcement, and brand asset is controlled by the admin here."
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

      {/* Basic Identity */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0a2540' }}>Institutional Identity</h3>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School Name (English)</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_name'] || ''}
              onChange={(e) => handleUpdate('school_name', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_name')} disabled={savingKey === 'school_name'}>
              {savingKey === 'school_name' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School Name (Nepali)</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_name_ne'] || ''}
              onChange={(e) => handleUpdate('school_name_ne', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_name_ne')} disabled={savingKey === 'school_name_ne'}>
              {savingKey === 'school_name_ne' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School Motto</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_motto'] || ''}
              onChange={(e) => handleUpdate('school_motto', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_motto')} disabled={savingKey === 'school_motto'}>
              {savingKey === 'school_motto' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Established Year (B.S.)</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['established_year_bs'] || ''}
              onChange={(e) => handleUpdate('established_year_bs', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('established_year_bs')} disabled={savingKey === 'established_year_bs'}>
              {savingKey === 'established_year_bs' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Official School Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Path: <code>{settings['school_logo_media_id'] || '/assets/images/logo.png'}</code>
            </span>
            <Button variant="secondary" onClick={() => setIsLogoPickerOpen(true)}>
              Choose from Media Library
            </Button>
          </div>
        </div>
      </div>

      {/* Contact & Hours */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0a2540' }}>Contact, Location & Office Hours</h3>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Campus Address</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_address'] || ''}
              onChange={(e) => handleUpdate('school_address', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_address')} disabled={savingKey === 'school_address'}>
              {savingKey === 'school_address' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Contact Phone Numbers</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_phone'] || ''}
              onChange={(e) => handleUpdate('school_phone', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_phone')} disabled={savingKey === 'school_phone'}>
              {savingKey === 'school_phone' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Official Email</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['school_email'] || ''}
              onChange={(e) => handleUpdate('school_email', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('school_email')} disabled={savingKey === 'school_email'}>
              {savingKey === 'school_email' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Office Hours & Working Days Wording</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['office_hours_text'] || ''}
              onChange={(e) => handleUpdate('office_hours_text', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('office_hours_text')} disabled={savingKey === 'office_hours_text'}>
              {savingKey === 'office_hours_text' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>WhatsApp Quick-Chat Number</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['whatsapp_number'] || ''}
              onChange={(e) => handleUpdate('whatsapp_number', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('whatsapp_number')} disabled={savingKey === 'whatsapp_number'}>
              {savingKey === 'whatsapp_number' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0a2540' }}>Site-Wide Announcement Bar</h3>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Banner Text</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['announcement_banner_text'] || ''}
              onChange={(e) => handleUpdate('announcement_banner_text', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('announcement_banner_text')} disabled={savingKey === 'announcement_banner_text'}>
              {savingKey === 'announcement_banner_text' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Banner Link Destination</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={settings['announcement_banner_link'] || ''}
              onChange={(e) => handleUpdate('announcement_banner_link', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <Button variant="secondary" onClick={() => saveSingle('announcement_banner_link')} disabled={savingKey === 'announcement_banner_link'}>
              {savingKey === 'announcement_banner_link' ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <MediaPicker
        open={isLogoPickerOpen}
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(media) => {
          const item: MediaItem = Array.isArray(media) ? media[0] : media;
          handleUpdate('school_logo_media_id', item.file_path);
          saveSingle('school_logo_media_id');
        }}
      />
    </div>
  );
}
