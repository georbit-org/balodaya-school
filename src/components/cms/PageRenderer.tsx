'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroSlideshow } from '@/components/hero/HeroSlideshow';
import { Icon } from '@/components/ui/Icon';
import type { CmsPage, CmsSection } from '@/server/cms';
import styles from './PageRenderer.module.css';

export interface PageRendererProps {
  page: CmsPage;
  canEdit?: boolean;
}

export function PageRenderer({ page, canEdit = false }: PageRendererProps) {
  const sections = page.sections || [];

  return (
    <div className={styles.pageWrapper}>
      {canEdit && (
        <div
          style={{
            background: '#0f172a',
            color: '#38bdf8',
            padding: '8px 16px',
            fontSize: '0.8125rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="activity" size={14} />
            <span>Admin CMS Mode: Editing <strong>&quot;{page.title}&quot;</strong> ({page.status})</span>
          </span>
          <Link
            href={`/app/site/pages/${page.id}`}
            style={{
              background: '#0284c7',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="edit" size={12} />
            <span>Open Page Editor</span>
          </Link>
        </div>
      )}

      {sections.map((section, idx) => (
        <section
          key={section.id ?? idx}
          id={`section-${section.id ?? idx}`}
          className={styles.sectionContainer}
        >
          {canEdit && (
            <div className={styles.adminSectionBar}>
              <span>Section: {section.type}</span>
              <Link
                href={`/app/site/pages/${page.id}?sectionId=${section.id}`}
                className={styles.adminEditLink}
              >
                Edit
              </Link>
            </div>
          )}

          <SectionContent section={section} />
        </section>
      ))}
    </div>
  );
}

function SectionContent({ section }: { section: CmsSection }) {
  const data = section.data || {};

  switch (section.type) {
    case 'hero_slider': {
      return <HeroSlideshow initialSlides={[]} />;
    }

    case 'photo_strip': {
      const title = (data.title as string) || '';
      const images = (data.images as Array<{ image_url: string; alt_text?: string }>) || [];
      return (
        <div className={styles.photoStripSection}>
          {title && (
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </div>
          )}
          <div className={styles.photoStripGrid}>
            {images.map((img, i) => (
              <div key={i} className={styles.photoStripCard}>
                <Image
                  src={img.image_url}
                  alt={img.alt_text || 'Balodaya school activity'}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className={styles.photoStripImg}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'quote': {
      const quoteText = (data.quote_en as string) || '';
      const author = (data.author as string) || '';
      const designation = (data.designation_en as string) || '';
      const avatarUrl = (data.avatar_url as string) || '';

      return (
        <div className={styles.quoteSection}>
          <div className={styles.quoteCard}>
            {avatarUrl && (
              <div className={styles.quoteAvatar}>
                <Image src={avatarUrl} alt={author} fill sizes="96px" style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div className={styles.quoteContent}>
              <p className={styles.quoteText}>&ldquo;{quoteText}&rdquo;</p>
              <div>
                <div className={styles.quoteAuthor}>{author}</div>
                {designation && <div className={styles.quoteRole}>{designation}</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'steps': {
      const title = (data.title as string) || '';
      const subtitle = (data.subtitle_en as string) || '';
      const steps = (data.steps as Array<{
        step_number: string;
        title_en: string;
        description_en: string;
        link?: string;
      }>) || [];

      return (
        <div className={styles.stepsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((st, i) => (
              <div key={i} className={styles.stepCard}>
                <span className={styles.stepNumber}>{st.step_number}</span>
                <h3 className={styles.stepTitle}>{st.title_en}</h3>
                <p className={styles.stepDesc}>{st.description_en}</p>
                {st.link && (
                  <Link
                    href={st.link}
                    style={{
                      marginTop: 'auto',
                      color: '#0284c7',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                    }}
                  >
                    Learn More →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'stats_row': {
      const stats = (data.stats as Array<{
        label_en: string;
        value: string;
        suffix?: string;
      }>) || [];

      return (
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            {stats.map((st, i) => (
              <div key={i}>
                <div className={styles.statValue}>
                  {st.value}
                  {st.suffix && <span className={styles.statSuffix}>{st.suffix}</span>}
                </div>
                <div className={styles.statLabel}>{st.label_en}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'image_text': {
      const badge = (data.badge as string) || '';
      const title = (data.title as string) || '';
      const content = (data.content_en as string) || '';
      const imageUrl = (data.image_url as string) || '';
      const imageAlt = (data.image_alt as string) || 'Balodaya school';
      const isLeft = (data.image_position as string) === 'left';

      return (
        <div className={styles.imageTextSection}>
          <div className={styles.imageTextGrid}>
            {isLeft && imageUrl && (
              <div className={styles.imageTextMedia}>
                <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div className={styles.imageTextContent}>
              {badge && <span className={styles.imageTextBadge}>{badge}</span>}
              <h2 className={styles.sectionTitle}>{title}</h2>
              <div className={styles.imageTextBody}>{content}</div>
            </div>
            {!isLeft && imageUrl && (
              <div className={styles.imageTextMedia}>
                <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'card_grid': {
      const title = (data.title as string) || '';
      const subtitle = (data.subtitle_en as string) || '';
      const columns = (data.columns as number) || 3;
      const cards = (data.cards as Array<{
        title_en: string;
        description_en: string;
        badge?: string;
      }>) || [];

      return (
        <div className={styles.cardGridSection}>
          {title && (
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{title}</h2>
              {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
            </div>
          )}
          <div
            className={styles.cardGrid}
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 2 ? '340px' : '280px'}, 1fr))`,
            }}
          >
            {cards.map((c, i) => (
              <div key={i} className={styles.cardGridItem}>
                {c.badge && (
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#0284c7',
                      background: '#e0f2fe',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {c.badge}
                  </span>
                )}
                <h3 className={styles.cardGridTitle}>{c.title_en}</h3>
                <p className={styles.cardGridDesc}>{c.description_en}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta_banner': {
      const title = (data.title_en as string) || '';
      const subtitle = (data.subtitle_en as string) || '';
      const btnText = (data.button_text_en as string) || '';
      const btnLink = (data.button_link as string) || '#';
      const secBtnText = (data.secondary_button_text as string) || '';
      const secBtnLink = (data.secondary_button_link as string) || '#';

      return (
        <div className={styles.ctaBannerSection}>
          <div className={styles.ctaBannerBox}>
            <h2 className={styles.ctaTitle}>{title}</h2>
            {subtitle && <p className={styles.ctaSubtitle}>{subtitle}</p>}
            <div className={styles.ctaActions}>
              <Link href={btnLink} className={styles.ctaPrimaryBtn}>
                {btnText}
              </Link>
              {secBtnText && (
                <Link href={secBtnLink} className={styles.ctaSecondaryBtn}>
                  {secBtnText}
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'faq': {
      const title = (data.title_en as string) || 'Frequently Asked Questions';
      const items = (data.items as Array<{ question_en: string; answer_en: string }>) || [];
      return <FaqSection title={title} items={items} />;
    }

    case 'contact_block': {
      return (
        <div style={{ padding: '48px 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Get in Touch with Balodaya</h2>
            <p className={styles.sectionSubtitle}>
              Sundar Bazar, Bheerkot-06, Syangja, Gandaki Province, Nepal
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Office Contact</h3>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="phone" size={15} style={{ color: '#0284c7' }} />
                <span>Phone: <strong>9846043838</strong></span>
              </p>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="mail" size={15} style={{ color: '#0284c7' }} />
                <span>Email: <strong>balodaya2063@gmail.com</strong></span>
              </p>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="clock" size={15} style={{ color: '#0284c7' }} />
                <span>Hours: <strong>Sunday - Friday (9:30 AM - 4:00 PM)</strong></span>
              </p>
              <p style={{ margin: '6px 0', color: '#64748b' }}>Weekly Off Day: Saturday</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Campus Location</h3>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>
                Located in the heart of Sundar Bazar, Bheerkot Municipality, Syangja. Easily accessible by school bus and public transport from Siddhartha Highway.
              </p>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

function FaqSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ question_en: string; answer_en: string }>;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className={styles.faqSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.faqContainer}>
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className={styles.faqItem}>
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <span>{item.question_en}</span>
                <span>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className={styles.faqAnswer}>{item.answer_en}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
