'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { schoolData } from '@/data/schoolData';

interface NavItem {
  name: string;
  href: string;
  badge?: string;
  description?: string;
  children?: {
    name: string;
    href: string;
    description: string;
  }[];
}

const NAV_STRUCTURE: NavItem[] = [
  {
    name: 'About',
    href: '/about',
    children: [
      { name: 'Genesis & Legacy', href: '/about#history', description: 'Founded in 2063 B.S. in Sundar Bazar, Bheerkot-06.' },
      { name: 'Vision & Himalayan Values', href: '/about#vision', description: 'Fostering ethical character, intellect, and civic duty.' },
      { name: 'Leadership & Faculty', href: '/about#leadership', description: 'Experienced educators with individual scholar mentorship.' },
      { name: 'Campus Facilities', href: '/facilities', description: 'Digicamp computer lab, science labs, and sports grounds.' },
    ],
  },
  {
    name: 'Academics',
    href: '/academics',
    children: [
      { name: 'Curriculum Framework', href: '/academics#curriculum', description: 'National Examinations Board (NEB) affiliated standards.' },
      { name: 'Early Discovery (Nursery–UKG)', href: '/academics#early-years', description: 'Montessori play-based numeracy, Devanagari & phonics.' },
      { name: 'Primary & Middle School (Grades 1–8)', href: '/academics#primary', description: 'Core mathematics, sciences, social studies & computing.' },
      { name: 'Secondary SEE Board Rigor (Grades 9–10)', href: '/academics#secondary', description: '100% First Division record & SEE board examination series.' },
    ],
  },
  {
    name: 'Admissions',
    href: '/admissions',
    badge: '2083/84 Open',
    children: [
      { name: 'Session 2083/84 Intake Guidelines', href: '/admissions#process', description: 'Admissions criteria from Nursery through Grade 9.' },
      { name: 'Eligibility & Age Criteria', href: '/admissions#criteria', description: 'Grade-wise age milestones & entrance assessment overview.' },
      { name: 'Fee Schedule & Transparency', href: '/admissions#fees', description: 'Annual breakdown with no hidden institutional charges.' },
      { name: 'Merit & Need Scholarships', href: '/admissions#scholarships', description: 'Need-based tuition assistance for promising rural scholars.' },
      { name: 'Online Application Portal', href: '/admissions#apply', description: 'Submit applicant credentials directly for administrative review.' },
    ],
  },
  {
    name: 'Student Life',
    href: '/student-life',
    children: [
      { name: 'Four Collegiate Houses', href: '/student-life#houses', description: 'Sagarmatha, Annapurna, Machhapuchhre & Dhaulagiri.' },
      { name: 'Daily Yoga & Mindfulness', href: '/student-life#yoga', description: 'Morning pranayama, flexibility, and character conditioning.' },
      { name: 'Sports & Mountain Athletics', href: '/student-life#athletics', description: 'Football, volleyball, badminton & annual athletic meets.' },
      { name: 'Literary & Cultural Societies', href: '/student-life#clubs', description: 'Devanagari recitation, public debate & cultural dance.' },
    ],
  },
  {
    name: 'Facilities',
    href: '/facilities',
    children: [
      { name: 'Digicamp Computing Lab', href: '/facilities#computing', description: '21st-century modern computing workstations & digital literacy.' },
      { name: 'Scientific Discovery Labs', href: '/facilities#science', description: 'Hands-on experiential physics, chemistry & biology apparatus.' },
      { name: 'Central School Library', href: '/facilities#library', description: 'Extensive academic textbooks, references & literature archive.' },
      { name: 'Safe Mountain Transit Network', href: '/facilities#transit', description: 'Dedicated bus routes traversing the Bheerkot-Syangja valley.' },
    ],
  },
  {
    name: 'Gallery',
    href: '/gallery',
  },
  {
    name: 'Notices',
    href: '/news',
    badge: 'Official',
  },
  {
    name: 'Portals',
    href: '/portal',
    children: [
      { name: 'Student Gradebook & Attendance', href: '/portal/student', description: 'View terminal marks, fee ledger, and library loans.' },
      { name: 'Parent Consultation Desk', href: '/portal/parent', description: 'Track student progress and communicate with school office.' },
      { name: 'Faculty & Teacher Workspace', href: '/portal/staff', description: 'Attendance recording, mark submissions, and syllabus planner.' },
      { name: 'Institutional SMS Admin Console', href: '/portal/admin', description: 'Comprehensive school management and registry desk.' },
    ],
  },
  {
    name: 'Contact',
    href: '/contact',
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      requestAnimationFrame(() => {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
        setSearchOpen(false);
      });
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (name: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const quickFilterResults = [
    { title: 'Admissions 2083/84 Intake', link: '/admissions', category: 'Admissions' },
    { title: 'Digicamp Computing Lab', link: '/facilities#computing', category: 'Facilities' },
    { title: 'SEE Board Curriculum & Subjects', link: '/academics#secondary', category: 'Academics' },
    { title: 'Student Houses & Athletics', link: '/student-life#houses', category: 'Student Life' },
    { title: 'Official Notices & Exam Routine', link: '/news', category: 'Notices' },
    { title: 'Student Management Portal', link: '/portal', category: 'Portal' },
    { title: 'Sundar Bazar Campus Location Map', link: '/contact', category: 'Contact' },
  ].filter((item) =>
    searchQuery === '' ? true : item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* 1. Top Utility Strip — FULL STRETCH (Edge-to-Edge) like Cambridge & DAIS */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          fontSize: '0.80rem',
          padding: '7px clamp(1rem, 3vw, 3.5rem)',
          borderBottom: '1px solid #1E293B',
          position: 'relative',
          zIndex: 60,
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--s-3)',
          }}
        >
          {/* Left: Stature & Motto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.74rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              Estd. 2063 B.S.
            </span>
            <span style={{ color: '#CBD5E1' }} className="d-lg-inline d-none">
              Sundar Bazar, Bheerkot-06, Syangja · 820m Elevation · NEB Nepal
            </span>
            <span style={{ color: '#475569' }} className="d-lg-inline d-none">•</span>
            <span style={{ color: '#38BDF8', fontFamily: 'var(--font-ne)', fontSize: '0.86rem' }}>
              शिक्षाको आवश्यकता, राष्ट्रको सभ्यता
            </span>
          </div>

          {/* Right: Cambridge/DAIS Audience Quick-Hubs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }} className="d-lg-inline-flex d-none">
              <Link href="/admissions" style={{ color: '#E2E8F0', textDecoration: 'none', fontSize: '0.78rem' }}>
                Prospective Parents
              </Link>
              <span style={{ color: '#334155' }}>|</span>
              <Link href="/portal" style={{ color: '#E2E8F0', textDecoration: 'none', fontSize: '0.78rem' }}>
                Student &amp; Parent Portals
              </Link>
              <span style={{ color: '#334155' }}>|</span>
              <Link href="/news" style={{ color: '#E2E8F0', textDecoration: 'none', fontSize: '0.78rem' }}>
                Notice Gazette
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="d-lg-inline-flex d-none">
              <span className="status-pulse-green" style={{ width: '7px', height: '7px' }} />
              <span style={{ color: '#38BDF8', fontSize: '0.78rem', fontWeight: 600 }}>
                2083/84 Enrolment Open
              </span>
            </div>

            <a
              href={`tel:${schoolData.contact.phone}`}
              style={{
                color: '#F8FAFC',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '0.80rem',
                backgroundColor: '#1E293B',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #334155',
              }}
            >
              <span style={{ color: '#38BDF8' }}>Helpline:</span> +977 {schoolData.contact.phone}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Rail — FULL STRETCH (Edge-to-Edge) */}
      <header
        style={{
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 55,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--rule)',
          padding: scrolled ? '10px clamp(1rem, 3vw, 3.5rem)' : '14px clamp(1rem, 3vw, 3.5rem)',
          transition: 'all 0.25s var(--ease)',
          boxShadow: scrolled ? '0 4px 16px -2px #BAE6FD' : '0 2px 8px -2px #E0F2FE',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--s-4)',
          }}
        >
          {/* Logo & School Identity (Cambridge & DAIS Crest styling) */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                position: 'relative',
                flexShrink: 0,
                backgroundColor: '#F0F7FF',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--rule)',
                padding: '2px',
              }}
            >
              <Image
                src="/assets/images/logo.png"
                alt="Balodaya School Crest"
                width={44}
                height={44}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '1.55rem',
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                Balodaya
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-dark)',
                  marginTop: '2px',
                }}
              >
                Secondary English Boarding School · Syangja
              </div>
            </div>
          </Link>

          {/* Desktop Edge-to-Edge Navigation Menu with Cambridge/DAIS Mega-Drop */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 'clamp(12px, 1.6vw, 24px)',
            }}
            className="d-lg-flex"
            aria-label="Primary Institutional Directory"
          >
            {NAV_STRUCTURE.map((item) => {
              const isActive = pathname === item.href || (item.children && item.children.some((c) => pathname.startsWith(c.href)));
              const isHovered = activeDropdown === item.name;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                  style={{ position: 'relative' }}
                >
                  <Link
                    href={item.href}
                    style={{
                      fontSize: '0.90rem',
                      color: isActive || isHovered ? 'var(--dawn-dark)' : 'var(--ink)',
                      fontWeight: isActive || isHovered ? 600 : 500,
                      textDecoration: 'none',
                      padding: '8px 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.2s var(--ease)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{item.name}</span>
                    {item.children && (
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        style={{
                          transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          opacity: 0.7,
                        }}
                      >
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {item.badge && (
                      <span
                        style={{
                          backgroundColor: '#E0F2FE',
                          color: '#0284C7',
                          border: '1px solid #BAE6FD',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          marginLeft: '2px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: 'var(--dawn)',
                        borderRadius: '2px',
                      }}
                    />
                  )}

                  {/* DAIS / Cambridge Mega-Menu Flyout (100% OPAQUE Solid Light Blue / White) */}
                  {item.children && isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '340px',
                        maxWidth: '460px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--rule)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 12px 36px -6px #93C5FD',
                        padding: '12px',
                        zIndex: 90,
                        marginTop: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: 'var(--dawn-dark)',
                          padding: '6px 12px',
                          borderBottom: '1px solid var(--rule-light)',
                          marginBottom: '6px',
                          backgroundColor: '#F0F7FF',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {item.name} Institutional Hub
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {item.children.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              textDecoration: 'none',
                              transition: 'background-color 0.15s ease',
                              display: 'block',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#E0F2FE';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                              {sub.name}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--ink-3)', marginTop: '2px', lineHeight: 1.4 }}>
                              {sub.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick Action Gateway (Cambridge / DAIS style Search & CTAs) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick Find / Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                height: '2.5rem',
                padding: '0 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--rule)',
                backgroundColor: '#F0F7FF',
                color: 'var(--ink-2)',
                fontSize: '0.82rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              className="d-lg-inline-flex d-none"
              title="Search school directory & circulars"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Quick Search</span>
            </button>

            <Link
              href="/portal"
              className="btn-outline d-lg-inline-flex d-none"
              style={{
                height: '2.5rem',
                padding: '0 16px',
                fontSize: '0.84rem',
              }}
            >
              Portal
            </Link>

            <Link
              href="/admissions"
              className="btn-primary"
              style={{
                height: '2.5rem',
                padding: '0 20px',
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px #BAE6FD',
              }}
            >
              Enrol 2083/84
            </Link>

            {/* Mobile Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                padding: '0.45rem 0.9rem',
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--ink)',
                backgroundColor: mobileMenuOpen ? 'var(--paper-2)' : '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              className="d-lg-none"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Interactive Quick Search Dialog Modal (Full Opaque) */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#0F172A',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'var(--s-12) var(--s-4)',
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--rule)',
              maxWidth: '620px',
              width: '100%',
              padding: 'var(--s-6)',
              boxShadow: '0 20px 45px -10px #0F172A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--dawn-dark)' }}>
                Search Institutional Portal &amp; Directory
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--ink-3)',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                [ ESC / Close ]
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search admissions, SEE board, houses, faculty, fees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '1rem',
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                backgroundColor: '#F0F7FF',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
              {quickFilterResults.map((res) => (
                <Link
                  key={res.title}
                  href={res.link}
                  onClick={() => setSearchOpen(false)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--rule-light)',
                    textDecoration: 'none',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E0F2FE';
                    e.currentTarget.style.borderColor = '#7DD3FC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--rule-light)';
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.92rem', color: 'var(--ink)' }}>{res.title}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: '#E0F2FE',
                      color: 'var(--dawn-dark)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {res.category}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Mobile Full-Width Slide-Over Menu (100% OPAQUE) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '80px',
            backgroundColor: 'var(--paper)',
            zIndex: 50,
            padding: 'var(--s-6)',
            overflowY: 'auto',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <div className="section-tag" style={{ marginBottom: 'var(--s-2)' }}>
              Institutional Directory
            </div>

            {NAV_STRUCTURE.map((item) => {
              const isActive = pathname === item.href;
              return (
                <div key={item.name} style={{ borderBottom: '1px solid var(--rule)', padding: '10px 0' }}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: isActive ? 'var(--dawn-dark)' : 'var(--ink)',
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.70rem',
                          backgroundColor: '#E0F2FE',
                          color: '#0284C7',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {item.children && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingLeft: '12px' }}>
                      {item.children.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--ink-2)',
                            textDecoration: 'none',
                            padding: '4px 0',
                          }}
                        >
                          • {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--s-6)', paddingTop: 'var(--s-6)', borderTop: '1px solid var(--rule)' }}>
            <Link
              href="/portal"
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center', height: '3rem', marginBottom: 'var(--s-3)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Access School Management Portal
            </Link>

            <Link
              href="/admissions"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '3rem', marginBottom: 'var(--s-3)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Submit Admission Application 2083/84
            </Link>

            <div
              style={{
                fontSize: '0.80rem',
                color: 'var(--ink-3)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Sundar Bazar, Bheerkot-06, Syangja, Nepal<br />
              Direct Helpline: +977 {schoolData.contact.phone}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
