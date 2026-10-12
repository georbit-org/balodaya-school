'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { LookupRecord, CustomFieldRecord } from '@/server/fields';
import styles from './page.module.css';

export default function FieldsAndLookupsPage() {
  const [tab, setTab] = useState<'lookups' | 'custom_fields'>('lookups');
  const [lookups, setLookups] = useState<LookupRecord[]>([]);
  const [fields, setFields] = useState<CustomFieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupKindFilter, setLookupKindFilter] = useState('all');
  const [fieldEntityFilter, setFieldEntityFilter] = useState('all');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dialog states
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [editingLookup, setEditingLookup] = useState<Partial<LookupRecord>>({
    kind: 'designation',
    code: '',
    label: '',
    label_ne: '',
    sort_order: 10,
    active: 1,
  });

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<Partial<CustomFieldRecord>>({
    entity: 'student',
    key: '',
    label: '',
    label_ne: '',
    type: 'text',
    options: '',
    required: 0,
    visible_roles: '["admin","principal"]',
    sort_order: 10,
    active: 1,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fields');
      if (!res.ok) throw new Error('Failed to load fields and lookups');
      const data = await res.json();
      setLookups(data.lookups || []);
      setFields(data.fields || []);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading options and fields.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveLookup = async () => {
    if (!editingLookup.code || !editingLookup.label) {
      alert('Code and English label are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'lookup', data: editingLookup }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save lookup');
      }
      setShowLookupModal(false);
      setStatusMsg({ type: 'success', text: `Saved lookup option "${editingLookup.label}"!` });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDeleteLookup = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;

    try {
      const res = await fetch(`/api/admin/fields?target=lookup&id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete lookup');
      setStatusMsg({ type: 'success', text: `Deleted "${label}" successfully.` });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSaveField = async () => {
    if (!editingField.key || !editingField.label) {
      alert('Key and English label are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'custom_field', data: editingField }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save custom field');
      }
      setShowFieldModal(false);
      setStatusMsg({ type: 'success', text: `Saved custom field "${editingField.label}"!` });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDeleteField = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to delete custom field "${label}"? Any existing values will be deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/fields?target=custom_field&id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete custom field');
      setStatusMsg({ type: 'success', text: `Deleted custom field "${label}" successfully.` });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const distinctLookupKinds = Array.from(new Set(lookups.map((l) => l.kind)));
  const filteredLookups = lookupKindFilter === 'all'
    ? lookups
    : lookups.filter((l) => l.kind === lookupKindFilter);

  const distinctEntities = Array.from(new Set(fields.map((f) => f.entity)));
  const filteredFields = fieldEntityFilter === 'all'
    ? fields
    : fields.filter((f) => f.entity === fieldEntityFilter);

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
        title="Lookups & Custom Form Fields"
        description="Administer school-wide dropdown choices (blood groups, designations, payment channels) and define custom questions for students, staff, and admissions."
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

      <div className={styles.mainTabs}>
        <button
          type="button"
          className={`${styles.mainTabBtn} ${tab === 'lookups' ? styles.mainTabBtnActive : ''}`}
          onClick={() => setTab('lookups')}
        >
          Dropdown Lookup Lists ({lookups.length})
        </button>
        <button
          type="button"
          className={`${styles.mainTabBtn} ${tab === 'custom_fields' ? styles.mainTabBtnActive : ''}`}
          onClick={() => setTab('custom_fields')}
        >
          Custom Entity Fields ({fields.length})
        </button>
      </div>

      {tab === 'lookups' ? (
        <>
          <div className={styles.topBar}>
            <div className={styles.filterChips}>
              <button
                type="button"
                className={`${styles.chipBtn} ${lookupKindFilter === 'all' ? styles.chipBtnActive : ''}`}
                onClick={() => setLookupKindFilter('all')}
              >
                All Categories
              </button>
              {distinctLookupKinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`${styles.chipBtn} ${lookupKindFilter === k ? styles.chipBtnActive : ''}`}
                  onClick={() => setLookupKindFilter(k)}
                >
                  {k.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setEditingLookup({
                  kind: lookupKindFilter === 'all' ? 'designation' : lookupKindFilter,
                  code: '',
                  label: '',
                  label_ne: '',
                  sort_order: 10,
                  active: 1,
                });
                setShowLookupModal(true);
              }}
            >
              + Add Lookup Option
            </Button>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Code Identifier</th>
                  <th>English Display</th>
                  <th>Nepali Display</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLookups.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {l.kind.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <code>{l.code}</code>
                    </td>
                    <td>{l.label}</td>
                    <td>{l.label_ne || '—'}</td>
                    <td>{l.sort_order}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: l.active ? '#dcfce7' : '#f1f5f9',
                          color: l.active ? '#15803d' : '#64748b',
                        }}
                      >
                        {l.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                        onClick={() => handleDeleteLookup(l.id, l.label)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className={styles.topBar}>
            <div className={styles.filterChips}>
              <button
                type="button"
                className={`${styles.chipBtn} ${fieldEntityFilter === 'all' ? styles.chipBtnActive : ''}`}
                onClick={() => setFieldEntityFilter('all')}
              >
                All Entities
              </button>
              {distinctEntities.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`${styles.chipBtn} ${fieldEntityFilter === e ? styles.chipBtnActive : ''}`}
                  onClick={() => setFieldEntityFilter(e)}
                >
                  {e.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setEditingField({
                  entity: fieldEntityFilter === 'all' ? 'student' : fieldEntityFilter,
                  key: '',
                  label: '',
                  label_ne: '',
                  type: 'text',
                  options: '',
                  required: 0,
                  visible_roles: '["admin","principal"]',
                  sort_order: 10,
                  active: 1,
                });
                setShowFieldModal(true);
              }}
            >
              + Add Custom Field
            </Button>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Field Key</th>
                  <th>Label (EN)</th>
                  <th>Label (NE)</th>
                  <th>Data Type</th>
                  <th>Required</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFields.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{f.entity}</span>
                    </td>
                    <td>
                      <code>{f.key}</code>
                    </td>
                    <td>{f.label}</td>
                    <td>{f.label_ne || '—'}</td>
                    <td>
                      <span style={{ fontStyle: 'italic', color: '#475569' }}>{f.type}</span>
                    </td>
                    <td>
                      {f.required ? (
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>Yes</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Optional</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                        onClick={() => handleDeleteField(f.id, f.label)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Lookup Modal */}
      {showLookupModal && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Add Lookup Option</h3>
            <div className={styles.formGrid}>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Category</label>
                <input
                  className={styles.input}
                  value={editingLookup.kind || ''}
                  onChange={(e) => setEditingLookup({ ...editingLookup, kind: e.target.value })}
                  placeholder="e.g. designation"
                />
              </div>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Code Identifier</label>
                <input
                  className={styles.input}
                  value={editingLookup.code || ''}
                  onChange={(e) => setEditingLookup({ ...editingLookup, code: e.target.value })}
                  placeholder="e.g. SENIOR_TEACHER"
                />
              </div>
              <div className={styles.fieldFull}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>English Label</label>
                <input
                  className={styles.input}
                  value={editingLookup.label || ''}
                  onChange={(e) => setEditingLookup({ ...editingLookup, label: e.target.value })}
                  placeholder="e.g. Senior Secondary Teacher"
                />
              </div>
              <div className={styles.fieldFull}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Nepali Label (Optional)</label>
                <input
                  className={styles.input}
                  value={editingLookup.label_ne || ''}
                  onChange={(e) => setEditingLookup({ ...editingLookup, label_ne: e.target.value })}
                  placeholder="e.g. माध्यमिक शिक्षक"
                />
              </div>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Sort Order</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingLookup.sort_order ?? 10}
                  onChange={(e) => setEditingLookup({ ...editingLookup, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <Button variant="secondary" onClick={() => setShowLookupModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveLookup}>
                Save Option
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {showFieldModal && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Add Custom Field</h3>
            <div className={styles.formGrid}>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Entity</label>
                <select
                  className={styles.input}
                  value={editingField.entity || 'student'}
                  onChange={(e) => setEditingField({ ...editingField, entity: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="application">Online Admission</option>
                  <option value="leave">Leave Request</option>
                </select>
              </div>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Field Key</label>
                <input
                  className={styles.input}
                  value={editingField.key || ''}
                  onChange={(e) => setEditingField({ ...editingField, key: e.target.value })}
                  placeholder="e.g. allergy_info"
                />
              </div>
              <div className={styles.fieldFull}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>English Label</label>
                <input
                  className={styles.input}
                  value={editingField.label || ''}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="e.g. Known Allergies & Medical History"
                />
              </div>
              <div className={styles.fieldFull}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Nepali Label</label>
                <input
                  className={styles.input}
                  value={editingField.label_ne || ''}
                  onChange={(e) => setEditingField({ ...editingField, label_ne: e.target.value })}
                  placeholder="e.g. एलर्जी तथा स्वास्थ्य विवरण"
                />
              </div>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Type</label>
                <select
                  className={styles.input}
                  value={editingField.type || 'text'}
                  onChange={(e) => setEditingField({ ...editingField, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select</option>
                  <option value="date">Date</option>
                  <option value="boolean">Checkbox Yes/No</option>
                </select>
              </div>
              <div className={styles.fieldHalf}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Required?</label>
                <select
                  className={styles.input}
                  value={editingField.required ? '1' : '0'}
                  onChange={(e) => setEditingField({ ...editingField, required: Number(e.target.value) })}
                >
                  <option value="0">Optional</option>
                  <option value="1">Mandatory</option>
                </select>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <Button variant="secondary" onClick={() => setShowFieldModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveField}>
                Save Field
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
