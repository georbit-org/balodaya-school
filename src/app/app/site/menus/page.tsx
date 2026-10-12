'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import type { SiteMenuItem } from '@/app/api/site-menu/route';

export default function SiteMenusManagerPage() {
  const [items, setItems] = useState<SiteMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<'header' | 'footer1' | 'footer2' | 'mobile'>('header');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Item Dialog
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLabelNe, setNewLabelNe] = useState('');
  const [newHref, setNewHref] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-menu');
      if (!res.ok) throw new Error('Failed to load menu items.');
      const data: SiteMenuItem[] = await res.json();
      setItems(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading menu items.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const zoneItems = items.filter((it) => it.zone === activeZone);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newHref.trim()) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/site-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: activeZone,
          label: newLabel.trim(),
          label_ne: newLabelNe.trim() || null,
          href: newHref.trim(),
          sort_order: zoneItems.length + 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create menu item');

      setIsNewOpen(false);
      setNewLabel('');
      setNewLabelNe('');
      setNewHref('');
      fetchMenus();
      setStatusMsg({ type: 'success', text: 'Menu link added successfully!' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error creating link',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (item: SiteMenuItem) => {
    try {
      const res = await fetch(`/api/site-menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: item.visible ? 0 : 1 }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, visible: it.visible ? 0 : 1 } : it))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Delete this menu link?')) return;
    try {
      const res = await fetch(`/api/site-menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setStatusMsg({ type: 'success', text: 'Menu item deleted.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to delete.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Site Navigation Menus"
        description="Configure header and footer links, menu labels in English and Nepali, and target destinations."
        actions={
          <Button variant="primary" onClick={() => setIsNewOpen(true)}>
            + Add Menu Link
          </Button>
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

      {/* Zone Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        {[
          { key: 'header', label: 'Main Header Nav' },
          { key: 'footer1', label: 'Footer Column 1 (Quick Links)' },
          { key: 'footer2', label: 'Footer Column 2 (School Information)' },
          { key: 'mobile', label: 'Mobile Drawer Menu' },
        ].map((z) => (
          <button
            key={z.key}
            type="button"
            onClick={() => setActiveZone(z.key as 'header' | 'footer1' | 'footer2' | 'mobile')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: activeZone === z.key ? '#e0f2fe' : 'transparent',
              color: activeZone === z.key ? '#0284c7' : '#64748b',
            }}
          >
            {z.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Label (English)</th>
                <th style={{ padding: '12px 16px' }}>Label (Nepali)</th>
                <th style={{ padding: '12px 16px' }}>Target URL / Path</th>
                <th style={{ padding: '12px 16px' }}>Visible</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zoneItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No menu links configured for this zone. Click &quot;+ Add Menu Link&quot; to add one.
                  </td>
                </tr>
              ) : (
                zoneItems.map((it) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{it.label}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{it.label_ne || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <code>{it.href}</code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(it)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: it.visible ? '#f0fdf4' : '#f8fafc',
                          color: it.visible ? '#166534' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {it.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(it.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isNewOpen} onClose={() => setIsNewOpen(false)} title={`Add Link to ${activeZone}`}>
        <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Menu Label (English) *</label>
            <input
              type="text"
              placeholder="e.g. Scholarship & Aid"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Menu Label (Nepali)</label>
            <input
              type="text"
              placeholder="e.g. छात्रवृत्ति"
              value={newLabelNe}
              onChange={(e) => setNewLabelNe(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Destination URL / Path *</label>
            <input
              type="text"
              placeholder="/scholarship or https://..."
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!newLabel.trim() || !newHref.trim() || saving}>
              {saving ? <Spinner size="sm" /> : 'Add Link'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
