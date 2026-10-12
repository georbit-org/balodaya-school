'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MediaPicker, MediaItem } from '@/components/media/MediaPicker';
import styles from './page.module.css';

interface UsageRef {
  entity: string;
  title: string;
  url: string;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Inspector Drawer State
  const [drawerAltText, setDrawerAltText] = useState('');
  const [drawerAltTextNe, setDrawerAltTextNe] = useState('');
  const [drawerCaption, setDrawerCaption] = useState('');
  const [drawerFolder, setDrawerFolder] = useState('general');
  const [drawerFocalX, setDrawerFocalX] = useState(0.5);
  const [drawerFocalY, setDrawerFocalY] = useState(0.5);
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [usageList, setUsageList] = useState<UsageRef[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (folder && folder !== 'all') q.set('folder', folder);
      if (search.trim()) q.set('search', search.trim());
      q.set('limit', '100');

      const res = await fetch(`/api/media?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to load media.');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading media assets.' });
    } finally {
      setLoading(false);
    }
  }, [folder, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectMediaItem = async (item: MediaItem) => {
    setSelectedItem(item);
    setDrawerAltText(item.alt_text || '');
    setDrawerAltTextNe(item.alt_text_ne || '');
    setDrawerCaption(item.caption || '');
    setDrawerFolder(item.folder || 'general');
    setDrawerFocalX(item.focal_x ?? 0.5);
    setDrawerFocalY(item.focal_y ?? 0.5);
    setStatusMsg(null);

    // Fetch usage
    setLoadingUsage(true);
    try {
      const res = await fetch(`/api/media/${item.id}/usage`);
      if (res.ok) {
        const data = await res.json();
        setUsageList(data.usage || []);
      } else {
        setUsageList([]);
      }
    } catch {
      setUsageList([]);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleFocalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDrawerFocalX(Math.round(x * 100) / 100);
    setDrawerFocalY(Math.round(y * 100) / 100);
  };

  const handleSaveMetadata = async () => {
    if (!selectedItem) return;
    setSavingDrawer(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/media/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt_text: drawerAltText.trim(),
          alt_text_ne: drawerAltTextNe.trim() || null,
          caption: drawerCaption.trim() || null,
          folder: drawerFolder,
          focal_x: drawerFocalX,
          focal_y: drawerFocalY,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save metadata');
      }

      const updated: MediaItem = await res.json();
      setSelectedItem(updated);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setStatusMsg({ type: 'success', text: 'Media details updated.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingDrawer(false);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItem || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setSavingDrawer(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/media/${selectedItem.id}/replace`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'File replacement failed');
      }

      const updated: MediaItem = await res.json();
      setSelectedItem(updated);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setStatusMsg({ type: 'success', text: 'File replaced in-place! All site references updated.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Replace failed',
      });
    } finally {
      setSavingDrawer(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!selectedItem) return;
    if (usageList.length > 0) {
      const confirmed = window.confirm(
        `This file is used in ${usageList.length} places (e.g. ${usageList[0].entity}). Are you sure you want to force delete it?`
      );
      if (!confirmed) return;
    } else {
      if (!window.confirm('Delete this media item from library?')) return;
    }

    try {
      const res = await fetch(`/api/media/${selectedItem.id}?force=true`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete media');
      }

      setItems((prev) => prev.filter((it) => it.id !== selectedItem.id));
      setSelectedItem(null);
      setStatusMsg({ type: 'success', text: 'Media item deleted.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Delete failed',
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setStatusMsg({ type: 'success', text: 'URL copied to clipboard!' });
  };

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Unified media center: every photo, logo, and document on Balodaya is controllable here."
        actions={
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            + Upload New Asset
          </Button>
        }
      />

      <div className={styles.pageLayout}>
        <div className={styles.mainContent}>
          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                placeholder="Search media by alt, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {['all', 'general', 'gallery', 'leadership', 'facilities', 'houses', 'branding'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.folderPill} ${folder === f ? styles.folderPillActive : ''}`}
                  onClick={() => setFolder(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No media assets found"
              description="Upload photos or adjust your search to populate the library."
              action={
                <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
                  Upload First Image
                </Button>
              }
            />
          ) : viewMode === 'grid' ? (
            <div className={styles.grid}>
              {items.map((item) => {
                const isActive = selectedItem?.id === item.id;
                const isImage = item.mime.startsWith('image/');
                return (
                  <div
                    key={item.id}
                    className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                    onClick={() => selectMediaItem(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') selectMediaItem(item);
                    }}
                  >
                    <div className={styles.cardThumb}>
                      {isImage ? (
                        <Image
                          src={item.file_path}
                          alt={item.alt_text}
                          fill
                          sizes="180px"
                          className={styles.cardImg}
                        />
                      ) : (
                        <div className={styles.cardPdf} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b' }}>
                          <Icon name="file-text" size={32} />
                        </div>
                      )}
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardTitle} title={item.alt_text || item.original_name || ''}>
                        {item.alt_text || item.original_name || `Media #${item.id}`}
                      </span>
                      <div className={styles.cardSub}>
                        <span>{item.folder}</span>
                        <span>{Math.round(item.size_bytes / 1024)} KB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Preview</th>
                    <th style={{ padding: '10px 14px' }}>Alt Text (Accessible Description)</th>
                    <th style={{ padding: '10px 14px' }}>Folder</th>
                    <th style={{ padding: '10px 14px' }}>Dimensions</th>
                    <th style={{ padding: '10px 14px' }}>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => selectMediaItem(item)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: selectedItem?.id === item.id ? '#f0f9ff' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 14px', width: '56px' }}>
                        {item.mime.startsWith('image/') ? (
                          <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                            <Image src={item.file_path} alt={item.alt_text} fill sizes="40px" style={{ objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>
                            <Icon name="file-text" size={20} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 14px', fontWeight: 500 }}>{item.alt_text}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <Badge variant="neutral">{item.folder}</Badge>
                      </td>
                      <td style={{ padding: '8px 14px', color: '#64748b' }}>
                        {item.width && item.height ? `${item.width}×${item.height}` : '—'}
                      </td>
                      <td style={{ padding: '8px 14px', color: '#64748b' }}>
                        {Math.round(item.size_bytes / 1024)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inspector Drawer */}
        {selectedItem && (
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <strong style={{ fontSize: '1rem' }}>Asset Inspector</strong>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close Inspector"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {statusMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                }}
              >
                {statusMsg.text}
              </div>
            )}

            {/* Image Preview with Interactive Focal Point */}
            {selectedItem.mime.startsWith('image/') && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  Click image to set crop focal point (X: {drawerFocalX}, Y: {drawerFocalY})
                </div>
                <div className={styles.previewContainer} onClick={handleFocalClick}>
                  <Image
                    src={selectedItem.file_path}
                    alt={selectedItem.alt_text}
                    fill
                    sizes="320px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div
                    className={styles.focalPointDot}
                    style={{
                      left: `${drawerFocalX * 100}%`,
                      top: `${drawerFocalY * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Alt Text (English) *</label>
              <textarea
                value={drawerAltText}
                onChange={(e) => setDrawerAltText(e.target.value)}
                rows={2}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Alt Text (Nepali)</label>
              <input
                type="text"
                value={drawerAltTextNe}
                onChange={(e) => setDrawerAltTextNe(e.target.value)}
                placeholder="नेपाली विवरण..."
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Caption</label>
              <input
                type="text"
                value={drawerCaption}
                onChange={(e) => setDrawerCaption(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Folder</label>
              <select
                value={drawerFolder}
                onChange={(e) => setDrawerFolder(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option value="general">General</option>
                <option value="gallery">Gallery</option>
                <option value="leadership">Leadership</option>
                <option value="council">Council</option>
                <option value="facilities">Facilities</option>
                <option value="houses">Houses</option>
                <option value="branding">Branding</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Button
                variant="primary"
                onClick={handleSaveMetadata}
                disabled={savingDrawer || !drawerAltText.trim()}
                style={{ flex: 1 }}
              >
                {savingDrawer ? <Spinner size="sm" /> : 'Save Metadata'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => copyUrl(selectedItem.file_path)}
              >
                Copy URL
              </Button>
            </div>

            {/* Replace in Place */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Replace in Place
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                Upload a newer photograph. Every website page, slide, or profile using this asset updates automatically.
              </p>
              <input
                ref={replaceInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleReplaceFile}
              />
              <Button
                variant="secondary"
                onClick={() => replaceInputRef.current?.click()}
                disabled={savingDrawer}
                style={{ width: '100%' }}
              >
                Upload Replacement File
              </Button>
            </div>

            {/* Usage Tracker */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Usage Tracker ({usageList.length})
              </div>
              {loadingUsage ? (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Checking references...</div>
              ) : usageList.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  No active CMS sections or slides currently reference this asset.
                </div>
              ) : (
                <div className={styles.usageList}>
                  {usageList.map((ref, idx) => (
                    <div key={idx} className={styles.usageItem}>
                      <div>
                        <strong>{ref.entity}</strong>: {ref.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <Button
                variant="danger"
                onClick={handleDeleteMedia}
                style={{ width: '100%' }}
              >
                Delete from Library
              </Button>
            </div>
          </aside>
        )}
      </div>

      <MediaPicker
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelect={(newMedia) => {
          const item = Array.isArray(newMedia) ? newMedia[0] : newMedia;
          setItems((prev) => [item, ...prev]);
          selectMediaItem(item);
        }}
      />
    </div>
  );
}
