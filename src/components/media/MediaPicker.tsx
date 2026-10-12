'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import styles from './MediaPicker.module.css';

export interface MediaItem {
  id: number;
  file_path: string;
  original_name: string | null;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  alt_text_ne: string | null;
  caption: string | null;
  folder: string;
  tags: string | null;
  focal_x: number;
  focal_y: number;
  visibility: 'public' | 'private';
}

export interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
  initialFolder?: string;
  title?: string;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  initialFolder = 'all',
  title = 'Select Media',
}: MediaPickerProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState(initialFolder);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setError(null);
      setUploadFile(null);
      return;
    }

    let active = true;
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (folder && folder !== 'all') queryParams.set('folder', folder);
        if (search.trim()) queryParams.set('search', search.trim());
        queryParams.set('limit', '48');

        const res = await fetch(`/api/media?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to load media.');
        const data = await res.json();
        if (active) {
          setItems(data.items || []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error fetching media');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      active = false;
    };
  }, [open, folder, search]);

  const toggleSelect = (item: MediaItem) => {
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      setSelectedIds([item.id]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter((it) => selectedIds.includes(it.id));
    if (multiple) {
      onSelect(selectedItems);
    } else {
      onSelect(selectedItems[0]);
    }
    onClose();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please choose a file to upload.');
      return;
    }
    if (uploadFile.type.startsWith('image/') && !altText.trim()) {
      setError('Alt text is required for accessibility.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('alt_text', altText.trim());
      if (caption.trim()) formData.append('caption', caption.trim());
      formData.append('folder', uploadFolder);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${res.status}`);
      }

      const uploaded: MediaItem = await res.json();
      setItems((prev) => [uploaded, ...prev]);
      if (multiple) {
        onSelect([uploaded]);
      } else {
        onSelect(uploaded);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} width="820px">
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'library' ? styles.tabActive : ''}`}
            onClick={() => setTab('library')}
          >
            Media Library
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'upload' ? styles.tabActive : ''}`}
            onClick={() => setTab('upload')}
          >
            Upload New File
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {tab === 'library' ? (
          <>
            <div className={styles.toolbar}>
              <input
                type="text"
                placeholder="Search by name, alt text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className={styles.folderSelect}
              >
                <option value="all">All Folders</option>
                <option value="general">General</option>
                <option value="gallery">Gallery</option>
                <option value="leadership">Leadership</option>
                <option value="council">Council</option>
                <option value="facilities">Facilities</option>
                <option value="houses">Houses</option>
                <option value="branding">Branding</option>
              </select>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="lg" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="No media found"
                description="Upload an image or adjust your search filter."
              />
            ) : (
              <div className={styles.grid}>
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isImage = item.mime.startsWith('image/');
                  return (
                    <div
                      key={item.id}
                      className={`${styles.itemCard} ${isSelected ? styles.itemSelected : ''}`}
                      onClick={() => toggleSelect(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSelect(item);
                        }
                      }}
                    >
                      <div className={styles.thumbWrapper}>
                        {isImage ? (
                          <Image
                            src={item.file_path}
                            alt={item.alt_text}
                            fill
                            sizes="140px"
                            className={styles.thumbImg}
                          />
                        ) : (
                          <div className={styles.pdfIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b' }}>
                            <Icon name="file-text" size={28} />
                          </div>
                        )}
                        {isSelected && (
                          <span className={styles.checkBadge} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="check" size={12} />
                          </span>
                        )}
                      </div>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemTitle} title={item.alt_text || item.original_name || ''}>
                          {item.alt_text || item.original_name || `Media #${item.id}`}
                        </span>
                        <span className={styles.itemMeta}>
                          {item.width && item.height ? `${item.width}×${item.height}` : `${Math.round(item.size_bytes / 1024)} KB`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.footer}>
              <span>
                {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={selectedIds.length === 0}
                  onClick={handleConfirmSelection}
                >
                  Choose Selected
                </Button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleUploadSubmit} className={styles.uploadArea}>
            <div
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#0284c7' }}>
                <Icon name="folder" size={36} />
              </div>
              <strong>
                {uploadFile ? uploadFile.name : 'Click to select or drag and drop a file'}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted, #64748b)', marginTop: '4px' }}>
                Images (JPEG, PNG, WebP, AVIF, GIF) up to 8MB or PDF up to 15MB
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Alt Text / Description <span style={{ color: '#dc2626' }}>* (Required)</span>
              </label>
              <input
                type="text"
                placeholder="Describe this image for screen readers and search engines..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                required
                className={styles.searchInput}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Caption (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional caption displayed under the photo..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Folder
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className={styles.folderSelect}
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

            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => setTab('library')}>
                Back to Library
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!uploadFile || !altText.trim() || isUploading}
              >
                {isUploading ? <Spinner size="sm" /> : 'Upload & Use'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
