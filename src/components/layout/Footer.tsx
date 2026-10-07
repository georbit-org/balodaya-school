'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { schoolData } from '@/data/schoolData';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        borderTop: '1px solid #1E293B',
        paddingTop: 'var(--s-20)',
        paddingBottom: 'var(--s-12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        {/* Colophon Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 'var(--s-8)',
            borderBottom: '1px solid #1E293B',
            paddingBottom: 'var(--s-12)',
            marginBottom: 'var(--s-10)',
          }}
        >
          {/* Column 1: School Identity & Motto */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  position: 'relative',
                  padding: '2px',
                  backgroundColor: '#1E293B',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Image
                  src="/assets/images/logo.png"
                  alt="Balodaya Crest"
                  width={34}
                  height={34}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                Estd. 2063 B.S.
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF', fontWeight: 600 }}>
              {schoolData.name}
            </h3>
            <p style={{ fontSize: '0.90rem', color: '#CBD5E1', marginBottom: '10px', fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{schoolData.motto}&rdquo;
            </p>
            <div style={{ fontFamily: 'var(--font-ne)', color: '#38BDF8', fontSize: '0.98rem', fontWeight: 500 }}>
              {schoolData.mottoNepali}
            </div>
            <div style={{ marginTop: '14px', fontSize: '0.80rem', color: '#94A3B8' }}>
              National Examinations Board (NEB) Affiliated
            </div>
          </div>

          {/* Column 2: Location & Terroir */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38BDF8', marginBottom: '12px' }}>
              Campus Location
            </div>
            <p style={{ fontSize: '0.90rem', color: '#CBD5E1', lineHeight: 1.7, marginBottom: '10px' }}>
              {schoolData.location.address}<br />
              {schoolData.location.municipality}<br />
              {schoolData.location.district}, {schoolData.location.province}<br />
              Federal Democratic Republic of Nepal
            </p>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Coordinates: 28.024° N, 83.742° E<br />
              Elevation: 820m MSL · Syangja Valley
            </div>
          </div>

          {/* Column 3: Contact & Hours */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38BDF8', marginBottom: '12px' }}>
              Administrative Inquiries
            </div>
            <p style={{ fontSize: '0.90rem', color: '#CBD5E1', lineHeight: 1.7, marginBottom: '10px' }}>
              Telephone:{' '}
              <a href={`tel:${schoolData.contact.phone}`} style={{ color: '#FFFFFF', textDecoration: 'underline' }}>
                +977 {schoolData.contact.phone}
              </a>
              <br />
              Electronic Mail:{' '}
              <a href={`mailto:${schoolData.contact.email}`} style={{ color: '#FFFFFF', textDecoration: 'underline' }}>
                {schoolData.contact.email}
              </a>
              <br />
              {schoolData.contact.hours}
            </p>
            <div style={{ fontSize: '0.78rem', color: '#38BDF8' }}>
              Campus Admissions Helpline: 9846043838
            </div>
          </div>

          {/* Column 4: Directory Links */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38BDF8', marginBottom: '12px' }}>
              Quick Index
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <Link href="/about" style={{ color: '#CBD5E1', textDecoration: 'none' }}>About &amp; Origin Story</Link>
              <Link href="/academics" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Academics &amp; SEE Rigor</Link>
              <Link href="/admissions" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Admissions 2083/84 Intake</Link>
              <Link href="/student-life" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Student Houses &amp; Yoga</Link>
              <Link href="/facilities" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Digicamp Computing Labs</Link>
              <Link href="/gallery" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Photo Archive &amp; Gallery</Link>
              <Link href="/news" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Notices &amp; Circulars</Link>
              <Link href="/portal" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}>School Management Portals</Link>
              <Link href="/contact" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Campus Map &amp; Desk</Link>
            </div>
          </div>
        </div>

        {/* Sub-Footer & Back to Top */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--s-4)',
            fontSize: '0.82rem',
            color: '#94A3B8',
          }}
        >
          <div>
            © {new Date().getFullYear()} Balodaya Secondary English Boarding School · Sundar Bazar, Bheerkot-06, Syangja.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-6)' }}>
            <span style={{ color: '#38BDF8' }}>NEB Nepal Affiliated</span>
            <button
              onClick={scrollToTop}
              style={{
                fontSize: '0.82rem',
                color: '#FFFFFF',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease)',
              }}
            >
              Back to Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
