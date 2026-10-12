'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { MediaPicker, MediaItem } from '@/components/media/MediaPicker';
import type { CmsPage, CmsSection, CmsVersion } from '@/server/cms';
import styles from './page.module.css';

export default function PageSectionEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pageId = parseInt(id, 10);

  const [page, setPage] = useState<CmsPage | null>(null);
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Section Modal
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState('image_text');

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<string | null>(null);

  // Versions Modal
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<CmsVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/pages/${pageId}`);
      if (!res.ok) throw new Error('Failed to load page');
      const data: CmsPage = await res.json();
      setPage(data);
      setSections(data.sections || []);
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error fetching page',
      });
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const activeSection = sections[selectedIdx];

  const handleUpdateActiveData = (key: string, value: unknown) => {
    if (!activeSection) return;
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== selectedIdx) return sec;
        return {
          ...sec,
          data: {
            ...sec.data,
            [key]: value,
          },
        };
      })
    );
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((sec, i) => ({ ...sec, sort_order: i + 1 }));
    });
    setSelectedIdx(targetIdx);
  };

  const handleDeleteSection = (idx: number) => {
    if (!window.confirm('Delete this section?')) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(0);
  };

  const handleAddSection = () => {
    let defaultData: Record<string, unknown> = {};
    if (newSectionType === 'image_text') {
      defaultData = {
        title: 'New Section Heading',
        content_en: 'Description text goes here...',
        image_url: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
        image_position: 'right',
      };
    } else if (newSectionType === 'quote') {
      defaultData = {
        quote_en: 'Inspiring quote for Balodaya students...',
        author: 'Principal Amrit Aryal',
        designation_en: 'Principal',
      };
    } else if (newSectionType === 'cta_banner') {
      defaultData = {
        title_en: 'Admissions Open 2083/84',
        button_text_en: 'Apply Now',
        button_link: '/admissions',
      };
    } else if (newSectionType === 'steps') {
      defaultData = {
        title: 'Process Steps',
        steps: [
          { step_number: '01', title_en: 'Step One', description_en: 'Description here' },
          { step_number: '02', title_en: 'Step Two', description_en: 'Description here' },
        ],
      };
    }

    const newSec: CmsSection = {
      page_id: pageId,
      type: newSectionType,
      sort_order: sections.length + 1,
      visible: 1,
      data: defaultData,
    };

    setSections((prev) => [...prev, newSec]);
    setSelectedIdx(sections.length);
    setIsAddSectionOpen(false);
  };

  const handleSaveDraft = async () => {
    if (!page) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/cms/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          status: 'draft',
          sections,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save draft');
      }

      setStatusMsg({ type: 'success', text: 'Draft saved successfully.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishLive = async () => {
    if (!page) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      // First save current edits
      await fetch(`/api/cms/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          sections,
        }),
      });

      // Then trigger publish
      const res = await fetch(`/api/cms/pages/${pageId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Published via admin section editor' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish');
      }

      const published: CmsPage = await res.json();
      setPage(published);
      setStatusMsg({ type: 'success', text: 'Page published live! Changes are visible immediately.' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Publish failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const openVersionsModal = async () => {
    setIsVersionsOpen(true);
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/cms/pages/${pageId}/versions`);
      if (res.ok) {
        const data: CmsVersion[] = await res.json();
        setVersions(data);
      }
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRevertVersion = async (versionId: number) => {
    if (!window.confirm('Revert page to this version? Current draft changes will be replaced.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/pages/${pageId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId }),
      });
      if (!res.ok) throw new Error('Revert failed');
      const reverted: CmsPage = await res.json();
      setPage(reverted);
      setSections(reverted.sections || []);
      setIsVersionsOpen(false);
      setStatusMsg({ type: 'success', text: 'Page successfully reverted to selected version!' });
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Revert failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const openMediaPickerFor = (field: string) => {
    setMediaTargetField(field);
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelected = (media: MediaItem | MediaItem[]) => {
    const item = Array.isArray(media) ? media[0] : media;
    if (mediaTargetField) {
      handleUpdateActiveData(mediaTargetField, item.file_path);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Page not found</h2>
        <Link href="/app/site/pages">← Back to Pages</Link>
      </div>
    );
  }

  return (
    <div className={styles.editorLayout}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.pageInfo}>
          <Link href="/app/site/pages" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}>
            ← Pages
          </Link>
          <strong style={{ fontSize: '1.1rem' }}>{page.title}</strong>
          <code>/{page.slug}</code>
          <Badge variant={page.status === 'published' ? 'success' : 'warning'}>
            {page.status}
          </Badge>
        </div>

        <div className={styles.topActions}>
          <Button variant="secondary" onClick={openVersionsModal}>
            History ({versions.length})
          </Button>
          <Link href={`/${page.slug}`} target="_blank" className="button secondary" style={{ textDecoration: 'none' }}>
            Preview Live
          </Link>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={handlePublishLive} disabled={saving} iconLeft={<Icon name="check" size={14} />}>
            {saving ? <Spinner size="sm" /> : 'Publish Live'}
          </Button>
        </div>
      </div>

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

      {/* Main Workspace */}
      <div className={styles.workspace}>
        {/* Left: Ordered Sections List */}
        <aside className={styles.sectionSidebar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem' }}>Sections ({sections.length})</strong>
            <Button variant="primary" onClick={() => setIsAddSectionOpen(true)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              + Add
            </Button>
          </div>

          <div className={styles.sectionList}>
            {sections.map((sec, idx) => {
              const isActive = selectedIdx === idx;
              return (
                <div
                  key={idx}
                  className={`${styles.sectionItem} ${isActive ? styles.sectionItemActive : ''}`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <span style={{ fontSize: '0.8125rem' }}>
                    {idx + 1}. {sec.type}
                  </span>
                  <div className={styles.sectionItemActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <Icon name="chevron-up" size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <Icon name="chevron-down" size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      style={{ color: '#dc2626' }}
                      onClick={() => handleDeleteSection(idx)}
                      title="Delete Section"
                      aria-label="Delete Section"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right: Section Form Editor */}
        <main className={styles.editPanel}>
          {activeSection ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0a2540' }}>
                  Edit Section: <code>{activeSection.type}</code>
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Position: #{selectedIdx + 1} of {sections.length}
                </span>
              </div>

              {/* Dynamic inputs based on activeSection.type */}
              {activeSection.type === 'hero_slider' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#475569', fontSize: '0.875rem' }}>
                    Hero slider uses the active slides from the Hero Slides manager.
                  </p>
                  <Link href="/app/hero-slides" style={{ color: '#0284c7', fontWeight: 600 }}>
                    Manage Hero Slides & Banners →
                  </Link>
                </div>
              )}

              {activeSection.type === 'image_text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Badge / Tagline (Optional)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.badge as string) || ''}
                      onChange={(e) => handleUpdateActiveData('badge', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Heading *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.title as string) || ''}
                      onChange={(e) => handleUpdateActiveData('title', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Content Text *</label>
                    <textarea
                      rows={5}
                      className={styles.textarea}
                      value={(activeSection.data.content_en as string) || ''}
                      onChange={(e) => handleUpdateActiveData('content_en', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Image Asset</label>
                    <div className={styles.imagePreviewBox}>
                      {activeSection.data.image_url ? (
                        <div className={styles.thumbImg}>
                          <Image
                            src={activeSection.data.image_url as string}
                            alt="Section image"
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>No image chosen</span>
                      )}
                      <Button variant="secondary" onClick={() => openMediaPickerFor('image_url')}>
                        Choose from Media Library
                      </Button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Image Position</label>
                    <select
                      className={styles.input}
                      value={(activeSection.data.image_position as string) || 'right'}
                      onChange={(e) => handleUpdateActiveData('image_position', e.target.value)}
                    >
                      <option value="right">Right Side</option>
                      <option value="left">Left Side</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSection.type === 'quote' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quote Message *</label>
                    <textarea
                      rows={4}
                      className={styles.textarea}
                      value={(activeSection.data.quote_en as string) || ''}
                      onChange={(e) => handleUpdateActiveData('quote_en', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Author Name *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.author as string) || ''}
                      onChange={(e) => handleUpdateActiveData('author', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Designation / Role</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.designation_en as string) || ''}
                      onChange={(e) => handleUpdateActiveData('designation_en', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Avatar Photo</label>
                    <div className={styles.imagePreviewBox}>
                      {activeSection.data.avatar_url ? (
                        <div className={styles.thumbImg}>
                          <Image
                            src={activeSection.data.avatar_url as string}
                            alt="Author avatar"
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>No photo</span>
                      )}
                      <Button variant="secondary" onClick={() => openMediaPickerFor('avatar_url')}>
                        Choose Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection.type === 'cta_banner' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Banner Heading *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.title_en as string) || ''}
                      onChange={(e) => handleUpdateActiveData('title_en', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Subheading</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={(activeSection.data.subtitle_en as string) || ''}
                      onChange={(e) => handleUpdateActiveData('subtitle_en', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Button Text *</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={(activeSection.data.button_text_en as string) || ''}
                        onChange={(e) => handleUpdateActiveData('button_text_en', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Button Link URL *</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={(activeSection.data.button_link as string) || ''}
                        onChange={(e) => handleUpdateActiveData('button_link', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* General JSON raw preview if specialized form not defined */}
              {!['hero_slider', 'image_text', 'quote', 'cta_banner'].includes(activeSection.type) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Section Configuration (JSON Data)</label>
                  <textarea
                    rows={12}
                    className={styles.textarea}
                    value={JSON.stringify(activeSection.data, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSections((prev) =>
                          prev.map((sec, i) => (i === selectedIdx ? { ...sec, data: parsed } : sec))
                        );
                      } catch {
                        // Allow typing
                      }
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Select a section from the left sidebar or click &quot;+ Add&quot; to create one.
            </div>
          )}
        </main>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={isAddSectionOpen} onClose={() => setIsAddSectionOpen(false)} title="Add Section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Select Section Type</label>
            <select
              value={newSectionType}
              onChange={(e) => setNewSectionType(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '6px' }}
            >
              <option value="image_text">Image + Text (Story / History / Origin)</option>
              <option value="quote">Quote & Leadership Message</option>
              <option value="cta_banner">Call to Action Banner</option>
              <option value="steps">Step-by-Step Guide (01, 02, 03)</option>
              <option value="card_grid">Card Grid (Values / Curriculum / Labs)</option>
              <option value="photo_strip">Photo Strip Gallery</option>
              <option value="faq">FAQ Accordion</option>
              <option value="notice_list">Latest Notices List</option>
              <option value="stats_row">Stats & Highlights Row</option>
              <option value="contact_block">Contact & Map Information</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSection}>
              Add to Page
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reusable MediaPicker */}
      <MediaPicker
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
      />

      {/* Version History Modal */}
      <Dialog open={isVersionsOpen} onClose={() => setIsVersionsOpen(false)} title="Version History">
        {loadingVersions ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
            <Spinner size="md" />
          </div>
        ) : versions.length === 0 ? (
          <p style={{ color: '#64748b' }}>No published versions recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {versions.map((ver) => (
              <div key={ver.id} className={styles.historyItem}>
                <div>
                  <strong>Version #{ver.id}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {ver.created_at} · {ver.note || 'Snapshot'}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleRevertVersion(ver.id)}>
                  Revert to this version
                </Button>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
