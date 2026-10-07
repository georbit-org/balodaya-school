import { NextResponse } from 'next/server';
import { query } from '@/server/db';

export interface HeroSlideRecord {
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
  // Normalized camelCase compatibility
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  order?: number;
  active?: boolean;
}

const STATIC_FALLBACK_SLIDES: HeroSlideRecord[] = [
  {
    id: 'slide-academic',
    badge: 'Academic Excellence · Kindergarten to Grade 10',
    title: 'Nurturing Character, Intellect, and Leadership in the Hills of Syangja',
    subtitle: 'Founded in 2063 B.S. in Sundar Bazar, Bheerkot-06. Combining rigorous academic discipline with values-based personal growth.',
    image: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
    primary_cta_text: 'Apply for Admission 2083/84',
    primary_cta_link: '/admissions',
    secondary_cta_text: 'Explore Academics',
    secondary_cta_link: '/academics',
    display_order: 1,
    is_active: 1,
  },
  {
    id: 'slide-digital',
    badge: 'Science & Digital Innovation · 21st Century Skills',
    title: 'Empowering Curious Minds with Modern Digital & Science Education',
    subtitle: 'Dedicated computing laboratory camps, experiential science instruction, and comprehensive preparation for the Secondary Education Examination (SEE).',
    image: '/assets/images/facilities/Digicamp1.JPG',
    primary_cta_text: 'View Campus Facilities',
    primary_cta_link: '/facilities',
    secondary_cta_text: 'Curriculum Roadmap',
    secondary_cta_link: '/academics',
    display_order: 2,
    is_active: 1,
  },
  {
    id: 'slide-athletics',
    badge: 'Athletics & Physical Vigor · Healthy Minds & Bodies',
    title: 'Fostering Teamwork, Resilience, and Sportsmanship Across All Grades',
    subtitle: 'Annual inter-house sports competitions, physical conditioning, yoga, and disciplined outdoor education on our mountain campus.',
    image: '/assets/images/home_page/banner/original/1689073824-3Banner3.jpg',
    primary_cta_text: 'Student Life & Athletics',
    primary_cta_link: '/student-life',
    secondary_cta_text: 'Campus Gallery',
    secondary_cta_link: '/gallery',
    display_order: 3,
    is_active: 1,
  },
  {
    id: 'slide-cultural',
    badge: 'Cultural Heritage & Civic Pride · राष्ट्रको सभ्यता',
    title: 'Grounding Future Leaders in Community Values and National Character',
    subtitle: '“The Need of Education, Civilization of the Nation” — cultivating responsible, ethical Nepali citizens rooted in cultural pride.',
    image: '/assets/images/home_page/banner/original/1689073856-4Banner4.jpg',
    primary_cta_text: 'Our Origin & Vision',
    primary_cta_link: '/about',
    secondary_cta_text: 'Official Bulletins',
    secondary_cta_link: '/news',
    display_order: 4,
    is_active: 1,
  },
];

export async function GET() {
  try {
    const rows = await query<HeroSlideRecord>(
      `SELECT id, badge, title, subtitle, image, 
              primary_cta_text, primary_cta_link, 
              secondary_cta_text, secondary_cta_link, 
              display_order, is_active
       FROM hero_slides 
       WHERE is_active = 1 
       ORDER BY display_order ASC, id ASC`
    );

    const slides = (rows && rows.length > 0 ? rows : STATIC_FALLBACK_SLIDES).map((s) => ({
      ...s,
      primaryCtaText: s.primary_cta_text,
      primaryCtaLink: s.primary_cta_link,
      secondaryCtaText: s.secondary_cta_text,
      secondaryCtaLink: s.secondary_cta_link,
      order: s.display_order,
      active: Boolean(s.is_active),
    }));

    return NextResponse.json({
      success: true,
      docs: slides,
      totalDocs: slides.length,
    });
  } catch {
    // If DB read fails, fall back to static verified slides
    const fallback = STATIC_FALLBACK_SLIDES.map((s) => ({
      ...s,
      primaryCtaText: s.primary_cta_text,
      primaryCtaLink: s.primary_cta_link,
      secondaryCtaText: s.secondary_cta_text,
      secondaryCtaLink: s.secondary_cta_link,
      order: s.display_order,
      active: Boolean(s.is_active),
    }));
    return NextResponse.json({
      success: true,
      docs: fallback,
      totalDocs: fallback.length,
    });
  }
}
