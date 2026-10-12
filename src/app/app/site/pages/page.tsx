'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import type { CmsPage } from '@/server/cms';
import styles from './page.module.css';

export default function CmsPagesListPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Page Dialog
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [titleNe, setTitleNe] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/pages');
      if (!res.ok) throw new Error('Failed to load CMS pages.');
      const data: CmsPage[] = await res.json();
      setPages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const autoSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          title_ne: titleNe.trim() || null,
          slug: autoSlug,
          status: 'draft',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create page');
      }

      const created: CmsPage = await res.json();
      setIsNewOpen(false);
      setTitle('');
      setTitleNe('');
      setSlug('');
      setPages((prev) => [...prev, created]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePage = async (id: number, pageTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${pageTitle}"?`)) return;

    try {
      const res = await fetch(`/api/cms/pages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting page');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Website Pages & CMS"
        description="Total admin control: edit every page, section, photo, and heading on the public site."
        actions={
          <Button variant="primary" onClick={() => setIsNewOpen(true)}>
            + Create New Page
          </Button>
        }
      />

      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Page Title</th>
                <th className={styles.th}>Slug (URL Path)</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Last Updated</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className={styles.row}>
                  <td className={styles.td}>
                    <strong>{p.title}</strong>
                    {p.title_ne && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.title_ne}</div>}
                  </td>
                  <td className={styles.td}>
                    <code>/{p.slug}</code>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={p.status === 'published' ? 'success' : 'warning'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    {p.is_system ? (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>System Core</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Custom Page</span>
                    )}
                  </td>
                  <td className={styles.td} style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {p.updated_at ? p.updated_at.slice(0, 10) : '—'}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <Link
                        href={`/app/site/pages/${p.id}`}
                        className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Icon name="edit" size={12} />
                        <span>Edit Sections</span>
                      </Link>
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        className={styles.actionBtn}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Icon name="eye" size={12} />
                        <span>View Live</span>
                      </Link>
                      {!p.is_system && (
                        <button
                          type="button"
                          onClick={() => handleDeletePage(p.id, p.title)}
                          className={styles.actionBtn}
                          style={{ color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Page Dialog */}
      <Dialog open={isNewOpen} onClose={() => setIsNewOpen(false)} title="Create New Page">
        <form onSubmit={handleCreatePage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Page Title (English) *</label>
            <input
              type="text"
              placeholder="e.g. Scholarship & Financial Aid"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Page Title (Nepali)</label>
            <input
              type="text"
              placeholder="e.g. छात्रवृत्ति सम्बन्धी जानकारी"
              value={titleNe}
              onChange={(e) => setTitleNe(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>URL Slug</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ color: '#64748b' }}>/</span>
              <input
                type="text"
                placeholder="scholarship"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!title.trim() || creating}>
              {creating ? <Spinner size="sm" /> : 'Create Page'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
