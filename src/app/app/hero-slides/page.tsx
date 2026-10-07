'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './HeroSlides.module.css';

interface HeroSlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface MediaPhoto {
  id: string;
  src: string;
  title: string;
  category: string;
}

export default function HeroSlidesManagementPage() {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [mediaPhotos, setMediaPhotos] = useState<MediaPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [imageTab, setImageTab] = useState<'library' | 'upload' | 'custom'>('library');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('All');

  // Form State
  const [form, setForm] = useState({
    id: '',
    title: '',
    badge: 'Academic Excellence · Kindergarten to Grade 10',
    subtitle: '',
    image: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
    primary_cta_text: 'Apply for Admission 2083/84',
    primary_cta_link: '/admissions',
    secondary_cta_text: 'Explore Academics',
    secondary_cta_link: '/academics',
    display_order: 1,
    is_active: 1,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteCandidate, setDeleteCandidate] = useState<HeroSlideItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/hero-slides');
      if (res.status === 403) {
        setError('You do not have administrative permission to manage hero slideshow slides.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load hero slides.');
      const data = await res.json();
      setSlides(data.slides || []);

      // Load media library in parallel
      const mediaRes = await fetch('/api/admin/hero-slides/media-library');
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMediaPhotos(mediaData.photos || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading slides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingSlide(null);
    setForm({
      id: `slide-${Date.now()}`,
      title: '',
      badge: 'Academic Excellence · Kindergarten to Grade 10',
      subtitle: '',
      image: mediaPhotos[0]?.src || '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
      primary_cta_text: 'Apply for Admission 2083/84',
      primary_cta_link: '/admissions',
      secondary_cta_text: 'Explore Academics',
      secondary_cta_link: '/academics',
      display_order: slides.length + 1,
      is_active: 1,
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (slide: HeroSlideItem) => {
    setEditingSlide(slide);
    setForm({
      id: slide.id,
      title: slide.title,
      badge: slide.badge,
      subtitle: slide.subtitle,
      image: slide.image,
      primary_cta_text: slide.primary_cta_text,
      primary_cta_link: slide.primary_cta_link,
      secondary_cta_text: slide.secondary_cta_text,
      secondary_cta_link: slide.secondary_cta_link,
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/hero-slides/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      setForm((prev) => ({ ...prev, image: data.url }));
      setImageTab('custom');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const isEdit = Boolean(editingSlide);
      const url = isEdit ? `/api/admin/hero-slides/${editingSlide!.id}` : '/api/admin/hero-slides';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save hero slide.');

      setIsDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving slide');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (slide: HeroSlideItem) => {
    try {
      const nextActive = slide.is_active === 1 ? 0 : 1;
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (res.ok) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, is_active: nextActive } : s))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleMoveOrder = async (slide: HeroSlideItem, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex((s) => s.id === slide.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const targetSlide = slides[targetIndex];

    try {
      // Swap display_orders
      await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: targetSlide.display_order }),
      });

      await fetch(`/api/admin/hero-slides/${targetSlide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: slide.display_order }),
      });

      loadData();
    } catch {
      // Ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${deleteCandidate.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteCandidate(null);
        loadData();
      }
    } catch {
      // Ignore
    }
  };

  const activeSlides = slides.filter((s) => s.is_active === 1);

  const filteredMediaPhotos =
    selectedPhotoCategory === 'All'
      ? mediaPhotos
      : mediaPhotos.filter((p) => p.category === selectedPhotoCategory);

  const columns: Column<HeroSlideItem>[] = [
    {
      key: 'preview',
      header: 'Preview',
      render: (row: HeroSlideItem) => (
        <div className={styles.tableThumbnailWrapper}>
          <Image
            src={row.image}
            alt={row.title}
            fill
            sizes="80px"
            className={styles.tableThumbnail}
          />
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (row: HeroSlideItem) => {
        const idx = slides.findIndex((s) => s.id === row.id);
        return (
          <div className={styles.orderButtons}>
            <span style={{ fontWeight: 600, minWidth: '18px' }}>{row.display_order}</span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleMoveOrder(row, 'up')}
              disabled={idx === 0}
              title="Move up"
            >
              &uarr;
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleMoveOrder(row, 'down')}
              disabled={idx === slides.length - 1}
              title="Move down"
            >
              &darr;
            </button>
          </div>
        );
      },
    },
    {
      key: 'content',
      header: 'Slide Content',
      render: (row: HeroSlideItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '11px', color: 'var(--sky-deep)', fontWeight: 600, textTransform: 'uppercase' }}>
            {row.badge}
          </span>
          <strong style={{ color: 'var(--ink)' }}>{row.title}</strong>
          <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{row.subtitle}</span>
        </div>
      ),
    },
    {
      key: 'links',
      header: 'Action Links',
      render: (row: HeroSlideItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--ink-faint)' }}>Primary: </span>
            <a href={row.primary_cta_link} target="_blank" rel="noreferrer">
              {row.primary_cta_text}
            </a>
          </div>
          {row.secondary_cta_link && (
            <div>
              <span style={{ color: 'var(--ink-faint)' }}>Secondary: </span>
              <a href={row.secondary_cta_link} target="_blank" rel="noreferrer">
                {row.secondary_cta_text}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: HeroSlideItem) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          className={`${styles.statusPill} ${
            row.is_active === 1 ? styles.statusActive : styles.statusInactive
          }`}
          title="Click to toggle status"
          style={{ cursor: 'pointer', border: 'none' }}
        >
          {row.is_active === 1 ? '● Active' : '○ Inactive'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: HeroSlideItem) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: 'var(--danger)' }}
            onClick={() => setDeleteCandidate(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <PageHeader
          title="Homepage Hero Slideshow"
          description="Manage rotating banner photography and promotional highlights."
        />
        <div style={{ padding: 'var(--sp-6)', background: 'var(--danger-wash)', color: 'var(--danger)', borderRadius: 'var(--radius)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Homepage Hero Slideshow"
        description="Curate rotating photographic banners, headline typography, and action links on the public Balodaya homepage."
        actions={
          <Button variant="primary" onClick={handleOpenAdd}>
            + Add New Slide
          </Button>
        }
      />

      {/* Live Slideshow Sequence Preview */}
      <section className={styles.previewStripCard} aria-labelledby="sequence-preview-heading">
        <div className={styles.previewHeader}>
          <div>
            <h2 id="sequence-preview-heading" className={styles.previewTitle}>
              Active Homepage Slideshow Sequence ({activeSlides.length} slides)
            </h2>
            <p className={styles.previewSubtitle}>
              These slides currently rotate sequentially every 6 seconds on the website homepage.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--sky-accent)', fontWeight: 600 }}
          >
            View Live Homepage &rarr;
          </a>
        </div>

        <div className={styles.slidesTrack}>
          {activeSlides.map((slide) => (
            <div key={slide.id} className={styles.previewSlideCard}>
              <div className={styles.previewSlideImageWrapper}>
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="220px"
                  className={styles.previewImage}
                />
                <span className={styles.previewBadge}>{slide.badge}</span>
                <span className={styles.orderBadge}>#{slide.display_order}</span>
              </div>
              <div className={styles.previewContent}>
                <h3 className={styles.previewSlideTitle} title={slide.title}>
                  {slide.title}
                </h3>
                <p className={styles.previewSlideSubtitle}>{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slide Management Table */}
      <section aria-label="Hero Slides Roster">
        <DataTable
          columns={columns}
          rows={slides}
          loading={loading}
          emptyText="No hero slides found. Click '+ Add New Slide' to create one."
        />
      </section>

      {/* Add / Edit Slide Modal */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {formError && (
            <div style={{ padding: '8px 12px', background: 'var(--danger-wash)', color: 'var(--danger)', borderRadius: '4px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <Field label="Slide Title (Main Headline)" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Nurturing Character, Intellect, and Leadership in Syangja"
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
            />
          </Field>

          <Field label="Promotional Badge Tag">
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="e.g. Academic Excellence · Kindergarten to Grade 10"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
            />
          </Field>

          <Field label="Subtitle / Description Paragraph">
            <textarea
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              rows={2}
              placeholder="e.g. Combining rigorous academic discipline with values-based personal growth."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
            />
          </Field>

          {/* Photographic Asset Picker */}
          <div>
            <div className={styles.imagePickerHeader}>
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
                Slide Photograph Selection
              </strong>
              <div className={styles.imageTabs}>
                <button
                  type="button"
                  className={`${styles.imageTabBtn} ${imageTab === 'library' ? styles.imageTabBtnActive : ''}`}
                  onClick={() => setImageTab('library')}
                >
                  School Photo Gallery
                </button>
                <button
                  type="button"
                  className={`${styles.imageTabBtn} ${imageTab === 'upload' ? styles.imageTabBtnActive : ''}`}
                  onClick={() => setImageTab('upload')}
                >
                  Upload New Photo
                </button>
                <button
                  type="button"
                  className={`${styles.imageTabBtn} ${imageTab === 'custom' ? styles.imageTabBtnActive : ''}`}
                  onClick={() => setImageTab('custom')}
                >
                  Image URL
                </button>
              </div>
            </div>

            {imageTab === 'library' && (
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['All', 'Assemblies & Campus Life', 'Campus & Facilities', 'Sports & House Honors', 'Events & Celebrations'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedPhotoCategory(cat)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '12px',
                        border: '1px solid var(--line)',
                        background: selectedPhotoCategory === cat ? 'var(--sky-accent)' : 'var(--surface-2)',
                        color: selectedPhotoCategory === cat ? '#FFF' : 'var(--ink-soft)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className={styles.galleryGrid}>
                  {filteredMediaPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`${styles.galleryPhotoItem} ${
                        form.image === photo.src ? styles.galleryPhotoItemSelected : ''
                      }`}
                      onClick={() => setForm({ ...form, image: photo.src })}
                      title={photo.title}
                    >
                      <Image src={photo.src} alt={photo.title} fill sizes="130px" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {imageTab === 'upload' && (
              <div style={{ padding: 'var(--sp-4)', border: '1px dashed var(--line-strong)', borderRadius: 'var(--radius)', textAlign: 'center', background: 'var(--surface-2)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
                  Upload a high-resolution authentic photograph of Balodaya School (JPEG, PNG, WebP up to 5MB).
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                {uploadingFile && <p style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '8px' }}>Uploading photograph...</p>}
              </div>
            )}

            {imageTab === 'custom' && (
              <Field label="Custom Image Path or Absolute URL">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/assets/images/home_page/banner/original/..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
                />
              </Field>
            )}

            {/* Current Chosen Image Preview */}
            {form.image && (
              <div className={styles.currentImagePreview}>
                <Image src={form.image} alt="Selected preview" fill sizes="400px" style={{ objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
            <Field label="Primary Button Text">
              <input
                type="text"
                value={form.primary_cta_text}
                onChange={(e) => setForm({ ...form, primary_cta_text: e.target.value })}
                placeholder="Apply for Admission"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
              />
            </Field>

            <Field label="Primary Button Link">
              <input
                type="text"
                value={form.primary_cta_link}
                onChange={(e) => setForm({ ...form, primary_cta_link: e.target.value })}
                placeholder="/admissions"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
            <Field label="Secondary Button Text">
              <input
                type="text"
                value={form.secondary_cta_text}
                onChange={(e) => setForm({ ...form, secondary_cta_text: e.target.value })}
                placeholder="Explore Academics"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
              />
            </Field>

            <Field label="Secondary Button Link">
              <input
                type="text"
                value={form.secondary_cta_link}
                onChange={(e) => setForm({ ...form, secondary_cta_link: e.target.value })}
                placeholder="/academics"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', alignItems: 'center' }}>
            <Field label="Display Sequence Order">
              <input
                type="number"
                min={1}
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '4px' }}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
              <input
                type="checkbox"
                id="is_active_checkbox"
                checked={form.is_active === 1}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="is_active_checkbox" style={{ fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                Active in Homepage Rotation
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Slide Deletion"
      >
        <div>
          <p style={{ margin: '0 0 var(--sp-4) 0', color: 'var(--ink)' }}>
            Are you sure you want to permanently delete the slide{' '}
            <strong>&ldquo;{deleteCandidate?.title}&rdquo;</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)' }}>
            <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: 'var(--danger)' }}
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
