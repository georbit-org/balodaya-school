import { schoolData } from '@/data/schoolData';

export interface DynamicHeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

export const FALLBACK_HERO_SLIDES: DynamicHeroSlide[] = [
  {
    id: 'slide-1',
    badge: 'Academic Excellence · Kindergarten to Grade 10',
    title: 'Nurturing Character, Intellect, and Leadership in the Hills of Syangja',
    subtitle: 'Founded in 2063 B.S. in Sundar Bazar, Bheerkot-06. Combining rigorous academic discipline with values-based personal growth.',
    image: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
    primaryCtaText: 'Apply for Admission 2083/84',
    primaryCtaLink: '/admissions',
    secondaryCtaText: 'Explore Academics',
    secondaryCtaLink: '/academics',
  },
  {
    id: 'slide-2',
    badge: 'Science & Digital Innovation · 21st Century Skills',
    title: 'Empowering Curious Minds with Modern Digital & Science Education',
    subtitle: 'Dedicated computing laboratory camps, experiential science instruction, and comprehensive preparation for the Secondary Education Examination (SEE).',
    image: '/assets/images/facilities/Digicamp1.JPG',
    primaryCtaText: 'View Campus Facilities',
    primaryCtaLink: '/facilities',
    secondaryCtaText: 'Curriculum Roadmap',
    secondaryCtaLink: '/academics',
  },
  {
    id: 'slide-3',
    badge: 'Athletics & Physical Vigor · Healthy Minds & Bodies',
    title: 'Fostering Teamwork, Resilience, and Sportsmanship Across All Grades',
    subtitle: 'Annual inter-house sports competitions, physical conditioning, yoga, and disciplined outdoor education on our mountain campus.',
    image: '/assets/images/home_page/banner/original/1689073824-3Banner3.jpg',
    primaryCtaText: 'Student Life & Athletics',
    primaryCtaLink: '/student-life',
    secondaryCtaText: 'Campus Gallery',
    secondaryCtaLink: '/gallery',
  },
  {
    id: 'slide-4',
    badge: 'Cultural Heritage & Civic Pride · राष्ट्रको सभ्यता',
    title: 'Grounding Future Leaders in Community Values and National Character',
    subtitle: '“The Need of Education, Civilization of the Nation” — cultivating responsible, ethical Nepali citizens rooted in cultural pride.',
    image: '/assets/images/home_page/banner/original/1689073856-4Banner4.jpg',
    primaryCtaText: 'Our Origin & Vision',
    primaryCtaLink: '/about',
    secondaryCtaText: 'Official Bulletins',
    secondaryCtaLink: '/news',
  },
];

/**
 * Fetch active hero slides from Payload CMS with graceful static fallback
 */
export async function getHeroSlides(): Promise<DynamicHeroSlide[]> {
  try {
    if (typeof window === 'undefined') {
      // In server components, fetch via internal endpoint or direct payload if available
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/api/hero-slides?where[active][equals]=true&sort=order`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.docs && data.docs.length > 0) {
          return data.docs.map((doc: any, idx: number) => ({
            id: doc.id || `cms-slide-${idx}`,
            badge: doc.badge || 'Academic Excellence',
            title: doc.title,
            subtitle: doc.subtitle || '',
            image: doc.backgroundImage?.url || doc.imageUrlFallback || FALLBACK_HERO_SLIDES[idx % FALLBACK_HERO_SLIDES.length].image,
            primaryCtaText: doc.primaryButtonLabel || 'Apply for Admission 2083/84',
            primaryCtaLink: doc.primaryButtonLink || '/admissions',
            secondaryCtaText: doc.secondaryButtonLabel || 'Explore Academics',
            secondaryCtaLink: doc.secondaryButtonLink || '/academics',
          }));
        }
      }
    }
  } catch {
    // Graceful fallback to verified authentic records
  }
  return FALLBACK_HERO_SLIDES;
}

/**
 * Fetch global site settings with fallback to schoolData
 */
export async function getSiteSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005';
    const res = await fetch(`${baseUrl}/api/globals/site-settings`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.schoolName) {
        return {
          ...schoolData,
          name: data.schoolName,
          nepaliName: data.schoolNepaliName || schoolData.nepaliName,
          motto: data.motto || schoolData.motto,
          mottoNepali: data.mottoNepali || schoolData.mottoNepali,
          contact: {
            ...schoolData.contact,
            phone: data.phone || schoolData.contact.phone,
            email: data.email || schoolData.contact.email,
            hours: data.officeHours || schoolData.contact.hours,
          },
        };
      }
    }
  } catch {
    // Graceful fallback
  }
  return schoolData;
}
