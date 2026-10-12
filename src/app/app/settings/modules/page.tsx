'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { ModuleFlag } from '@/app/api/admin/feature-flags/route';

export default function ModulesManagerPage() {
  const [modules, setModules] = useState<ModuleFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (!res.ok) throw new Error('Failed to load module flags');
      const data: ModuleFlag[] = await res.json();
      setModules(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading module flags.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleToggle = async (mod: ModuleFlag) => {
    const newEnabled = !mod.enabled;
    setTogglingKey(mod.key);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: mod.key, enabled: newEnabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle module');

      setModules((prev) =>
        prev.map((m) => (m.key === mod.key ? { ...m, enabled: newEnabled } : m))
      );
      setStatusMsg({
        type: 'success',
        text: `Module "${mod.name}" is now ${newEnabled ? 'ENABLED' : 'DISABLED'}.`,
      });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating module',
      });
    } finally {
      setTogglingKey(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
      <PageHeader
        title="Modules & Feature Flags"
        description="Turn entire school management modules on or off with a single click. Disabled modules vanish from user navigation and portals."
        actions={
          <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
            ← Settings Center
          </Link>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {modules.map((m) => {
          const isToggling = togglingKey === m.key;
          return (
            <div
              key={m.key}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1rem', color: '#0a2540' }}>{m.name}</strong>
                  <Badge variant={m.enabled ? 'success' : 'neutral'}>
                    {m.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({m.category})</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{m.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(m)}
                disabled={isToggling}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: m.enabled ? '#fee2e2' : '#e0f2fe',
                  color: m.enabled ? '#b91c1c' : '#0284c7',
                  minWidth: '100px',
                }}
              >
                {isToggling ? '...' : m.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
