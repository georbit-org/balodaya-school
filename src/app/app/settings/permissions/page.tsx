'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import type { PermissionDefinition } from '@/app/api/admin/permissions/route';
import type { Role } from '@/lib/permissions';

interface OverrideRow {
  role: string;
  action: string;
  allowed: number;
  reason: string | null;
}

export default function PermissionsMatrixPage() {
  const [definitions, setDefinitions] = useState<PermissionDefinition[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to load permissions matrix.');
      const data = await res.json();
      setDefinitions(data.definitions || []);
      setRoles(data.roles || []);
      setOverrides(data.overrides || []);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading permissions matrix.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const isAllowed = (role: Role, action: string, def: PermissionDefinition): boolean => {
    const override = overrides.find((o) => o.role === role && o.action === action);
    if (override) {
      return Boolean(override.allowed);
    }
    return Boolean(def.defaults[role]);
  };

  const isOverridden = (role: Role, action: string): boolean => {
    return overrides.some((o) => o.role === role && o.action === action);
  };

  const handleToggle = async (role: Role, action: string, currentVal: boolean) => {
    const newVal = !currentVal;
    const isRisky = (role === 'student' || role === 'parent') && newVal === true;
    let reason = '';

    if (isRisky) {
      const input = window.prompt(
        `SECURITY GUARD RAIL: Granting ${action} to ${role} is an administrative escalation. Please enter a mandatory justification reason (min 8 characters):`
      );
      if (!input || input.trim().length < 8) {
        alert('Action cancelled: valid reason is required.');
        return;
      }
      reason = input.trim();
    }

    const key = `${role}:${action}`;
    setSavingKey(key);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, action, allowed: newVal, reason }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update permission');
      }

      setOverrides((prev) => {
        const filtered = prev.filter((o) => !(o.role === role && o.action === action));
        return [...filtered, { role, action, allowed: newVal ? 1 : 0, reason: reason || null }];
      });
      setStatusMsg({ type: 'success', text: `Updated permission: ${role}.${action} → ${newVal ? 'ALLOWED' : 'DENIED'}` });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset ALL permission overrides to factory defaults?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permissions/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      setOverrides([]);
      setStatusMsg({ type: 'success', text: 'All permission overrides cleared! Factory defaults restored.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Reset failed',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Group definitions by category
  const categories = Array.from(new Set(definitions.map((d) => d.category)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Roles & Permissions Control Matrix"
        description="Total admin control: configure which roles can view, create, edit, approve, and collect across the entire school management system."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
              ← Settings Center
            </Link>
            <Button variant="danger" onClick={handleResetDefaults} disabled={overrides.length === 0}>
              Reset to Defaults ({overrides.length} Overrides)
            </Button>
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

      {categories.map((cat) => {
        const catDefs = definitions.filter((d) => d.category === cat);
        return (
          <div
            key={cat}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '1rem', color: '#0a2540' }}>{cat} Operations</strong>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', width: '38%' }}>Capability / Action</th>
                  {roles.map((r) => (
                    <th key={r} style={{ padding: '10px 14px', textAlign: 'center', textTransform: 'capitalize' }}>
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catDefs.map((def) => (
                  <tr key={def.action} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{def.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {def.description} (<code>{def.action}</code>)
                      </div>
                    </td>

                    {roles.map((r) => {
                      const allowed = isAllowed(r, def.action, def);
                      const overridden = isOverridden(r, def.action);
                      const cellKey = `${r}:${def.action}`;
                      const isSavingThis = savingKey === cellKey;

                      return (
                        <td key={r} style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggle(r, def.action, allowed)}
                            disabled={isSavingThis}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: overridden ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              background: allowed ? '#f0fdf4' : '#f8fafc',
                              color: allowed ? '#166534' : '#94a3b8',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isSavingThis ? (
                              '...'
                            ) : allowed ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icon name="check" size={12} />
                                <span>Allowed</span>
                                {overridden && <span style={{ fontSize: '0.65rem', color: '#0284c7' }}>(custom)</span>}
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icon name="x" size={12} />
                                <span>Denied</span>
                                {overridden && <span style={{ fontSize: '0.65rem', color: '#0284c7' }}>(custom)</span>}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
