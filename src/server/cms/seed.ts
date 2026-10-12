import { query, run, batch, one } from '../db';
import { SCHOOL_INFO } from '../../content/school';
import { LEADERSHIP_INFO } from '../../content/leadership';

export async function seedCmsDefaultsIfEmpty(): Promise<boolean> {
  const existing = await one<{ cnt: number }>('SELECT count(*) as cnt FROM cms_pages');
  if (existing && existing.cnt > 0) {
    return false; // Already seeded
  }

  console.log('Seeding initial CMS pages and sections from content defaults...');

  // 1. Pages to create
  const pages = [
    {
      slug: '',
      title: SCHOOL_INFO.name,
      title_ne: 'बालोदय सेकेण्डरी इङ्ग्लिश बोर्डिङ्ग स्कूल',
      seo_title: `${SCHOOL_INFO.shortName} · Bheerkot-06, Syangja, Nepal`,
      seo_description: `${SCHOOL_INFO.name} - ${SCHOOL_INFO.motto}. Established ${SCHOOL_INFO.establishedBS} in Bheerkot, Syangja.`,
      is_system: 1,
      status: 'published' as const,
      nav_order: 1,
      sections: [
        {
          type: 'hero_slider',
          sort_order: 1,
          visible: 1,
          data: {
            use_system_slides: true,
            autoplay_speed_ms: 6000,
          },
        },
        {
          type: 'photo_strip',
          sort_order: 2,
          visible: 1,
          data: {
            title: 'Campus Life & Moments',
            images: [
              {
                image_url: '/assets/images/home_page/banner/original/1689073694-1Banner1.jpg',
                alt_text: 'Morning School Assembly Formation',
              },
              {
                image_url: '/assets/images/home_page/banner/original/1689073769-2Banner2.jpg',
                alt_text: 'Students in Formal School Uniform',
              },
              {
                image_url: '/assets/images/home_page/banner/original/1689073824-3Banner3.jpg',
                alt_text: 'Primary & Junior Assembly Formation',
              },
              {
                image_url: '/assets/images/home_page/banner/original/1689073856-4Banner4.jpg',
                alt_text: 'National Anthem & Flag Ceremony',
              },
            ],
          },
        },
        {
          type: 'quote',
          sort_order: 3,
          visible: 1,
          data: {
            quote_en: LEADERSHIP_INFO.chairman.message,
            author: LEADERSHIP_INFO.chairman.name,
            designation_en: LEADERSHIP_INFO.chairman.title,
            avatar_url: LEADERSHIP_INFO.chairman.image,
          },
        },
        {
          type: 'steps',
          sort_order: 4,
          visible: 1,
          data: {
            title: 'How to Apply for Admission',
            subtitle_en: 'Simple three-step enrollment process for the academic year 2083/84 B.S.',
            steps: [
              {
                step_number: '01',
                title_en: 'Online Inquiry & Registration',
                description_en: 'Submit student details and guardian contact through our portal or visit campus reception.',
                link: '/admissions',
              },
              {
                step_number: '02',
                title_en: 'Document Review & Assessment',
                description_en: 'Provide previous academic grade-sheets, birth certificate, and transfer certificate for evaluation.',
                link: '/admissions',
              },
              {
                step_number: '03',
                title_en: 'Enrollment & Welcome Orientation',
                description_en: 'Complete fee clearance, collect uniform & book list, and receive parent portal access credentials.',
                link: '/admissions',
              },
            ],
          },
        },
        {
          type: 'stats_row',
          sort_order: 5,
          visible: 1,
          data: {
            stats: [
              { label_en: 'Established', value: '2063', suffix: 'B.S.', icon: 'calendar' },
              { label_en: 'SEE Success Rate', value: '100', suffix: '%', icon: 'exams' },
              { label_en: 'School Houses', value: '5', suffix: 'Houses', icon: 'houses' },
              { label_en: 'Faculty & Staff', value: '35', suffix: '+', icon: 'staff' },
            ],
          },
        },
        {
          type: 'notice_list',
          sort_order: 6,
          visible: 1,
          data: {
            title: 'Official Circulars & Notices',
            count: 4,
            category: 'all',
            show_view_all: true,
          },
        },
        {
          type: 'cta_banner',
          sort_order: 7,
          visible: 1,
          data: {
            title_en: 'Admissions Open for Academic Year 2083/84 B.S.',
            subtitle_en: 'Nurturing curiosity, discipline, and values from Playgroup to Grade 10.',
            button_text_en: 'Apply for Admission',
            button_link: '/admissions',
            secondary_button_text: 'Contact School Office',
            secondary_button_link: '/contact',
          },
        },
      ],
    },
    {
      slug: 'about',
      title: 'About Balodaya',
      title_ne: 'हाम्रो बारेमा',
      seo_title: `About Us · ${SCHOOL_INFO.shortName}`,
      seo_description: SCHOOL_INFO.aboutText.slice(0, 160),
      is_system: 1,
      status: 'published' as const,
      nav_order: 2,
      sections: [
        {
          type: 'image_text',
          sort_order: 1,
          visible: 1,
          data: {
            badge: 'Our Origin Story',
            title: 'A Vision Born in 2063 B.S.',
            content_en: SCHOOL_INFO.originText,
            image_url: '/assets/images/home_page/banner/original/1689085439-7Banner7.jpeg',
            image_alt: 'Balodaya Campus and Academic Buildings',
            image_position: 'right',
          },
        },
        {
          type: 'card_grid',
          sort_order: 2,
          visible: 1,
          data: {
            title: 'Vision, Mission & Core Values',
            columns: 3,
            cards: [
              {
                title_en: 'Our Vision',
                description_en: SCHOOL_INFO.visionText,
                icon: 'star',
              },
              {
                title_en: 'Our Mission',
                description_en: SCHOOL_INFO.missionText,
                icon: 'compass',
              },
              {
                title_en: 'Core Principles',
                description_en: 'Integrity, Academic Rigor, Character Building, Mutual Respect, and Lifelong Curiosity.',
                icon: 'shield',
              },
            ],
          },
        },
        {
          type: 'quote',
          sort_order: 3,
          visible: 1,
          data: {
            quote_en: LEADERSHIP_INFO.principal.message,
            author: LEADERSHIP_INFO.principal.name,
            designation_en: LEADERSHIP_INFO.principal.title,
            avatar_url: LEADERSHIP_INFO.principal.image,
          },
        },
        {
          type: 'staff_grid',
          sort_order: 4,
          visible: 1,
          data: {
            title: 'Our Dedicated Educators & Administration',
            department: 'all',
          },
        },
      ],
    },
    {
      slug: 'academics',
      title: 'Academics & Curriculum',
      title_ne: 'शैक्षिक कार्यक्रम',
      seo_title: `Academics & Programs · ${SCHOOL_INFO.shortName}`,
      seo_description: 'National curriculum enriched with digital learning, laboratory experiments, and co-curricular programs.',
      is_system: 1,
      status: 'published' as const,
      nav_order: 3,
      sections: [
        {
          type: 'card_grid',
          sort_order: 1,
          visible: 1,
          data: {
            title: 'Academic Levels & Stages',
            columns: 3,
            cards: [
              {
                title_en: 'Early Childhood & Kindergarten',
                description_en: 'Playgroup, Nursery, LKG, and UKG focused on child development, phonics, motor skills, and creative play.',
                badge: 'Playgroup - UKG',
              },
              {
                title_en: 'Primary Education (Grades 1 - 5)',
                description_en: 'Foundational literacy, mathematics, science, social studies, and English fluency with supportive mentoring.',
                badge: 'Class 1 - 5',
              },
              {
                title_en: 'Lower Secondary & Secondary (Grades 6 - 10)',
                description_en: 'Rigorous national SEE preparation, practical computer science, advanced laboratories, and critical thinking.',
                badge: 'Class 6 - 10',
              },
            ],
          },
        },
        {
          type: 'houses_grid',
          sort_order: 2,
          visible: 1,
          data: {
            title: 'The Five Houses of Balodaya',
            show_points: true,
          },
        },
      ],
    },
    {
      slug: 'admissions',
      title: 'Admissions 2083/84',
      title_ne: 'भर्ना सम्बन्धी जानकारी',
      seo_title: `Admissions · ${SCHOOL_INFO.shortName}`,
      seo_description: 'Join the Balodaya family. Find admission requirements, application procedure, and fee guidelines.',
      is_system: 1,
      status: 'published' as const,
      nav_order: 4,
      sections: [
        {
          type: 'steps',
          sort_order: 1,
          visible: 1,
          data: {
            title: 'Admission Procedure',
            subtitle_en: 'Clear pathway for prospective students and parents.',
            steps: [
              {
                step_number: '1',
                title_en: 'Collect or Download Application Form',
                description_en: 'Obtain admission form from the school office or fill out online inquiry.',
              },
              {
                step_number: '2',
                title_en: 'Assessment & Interaction',
                description_en: 'Friendly child interaction and academic assessment to ensure proper grade readiness.',
              },
              {
                step_number: '3',
                title_en: 'Submission & Confirmation',
                description_en: 'Submit required birth certificate, prior report cards, and confirm enrollment.',
              },
            ],
          },
        },
        {
          type: 'faq',
          sort_order: 2,
          visible: 1,
          data: {
            title_en: 'Admission Frequently Asked Questions',
            items: [
              {
                question_en: 'What documents are required for admission?',
                answer_en: 'Student birth certificate, 2 passport-size photographs, previous school transfer certificate (TC) and character certificate, and previous year grade-sheet.',
              },
              {
                question_en: 'Is school transport available?',
                answer_en: 'Yes, Balodaya operates dedicated school buses covering Sundar Bazar, Bayarghari, and surrounding areas in Bheerkot Municipality.',
              },
              {
                question_en: 'What are the school operating hours?',
                answer_en: 'Sunday to Friday: 9:30 AM to 4:00 PM. Saturday is the weekly off day.',
              },
            ],
          },
        },
      ],
    },
    {
      slug: 'facilities',
      title: 'Campus & Facilities',
      title_ne: 'भौतिक पूर्वाधार तथा सुविधाहरू',
      seo_title: `Campus & Facilities · ${SCHOOL_INFO.shortName}`,
      seo_description: 'Explore our modern science labs, computer lab, library, sports ground, and school bus service.',
      is_system: 1,
      status: 'published' as const,
      nav_order: 5,
      sections: [
        {
          type: 'card_grid',
          sort_order: 1,
          visible: 1,
          data: {
            title: 'Modern Learning Infrastructure',
            columns: 3,
            cards: [
              {
                title_en: 'Computer & Digital Lab',
                description_en: 'High-speed internet workstations with modern programming and digital literacy software.',
                icon: 'screen',
              },
              {
                title_en: 'Science Laboratories',
                description_en: 'Hands-on physics, chemistry, and biology equipment for experimental learning.',
                icon: 'beaker',
              },
              {
                title_en: 'School Library',
                description_en: 'Extensive collection of reference books, literature, storybooks, and periodicals.',
                icon: 'book',
              },
              {
                title_en: 'Sports Ground & Athletics',
                description_en: 'Courtyards for volleyball, badminton, football, and martial arts training.',
                icon: 'trophy',
              },
              {
                title_en: 'School Bus Transport',
                description_en: 'Safe, punctual, and reliable transportation across Bheerkot Municipality.',
                icon: 'transport',
              },
              {
                title_en: 'Hygienic Cafeteria',
                description_en: 'Clean, nutritious lunch and afternoon tiffin prepared fresh daily.',
                icon: 'sparkles',
              },
            ],
          },
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Contact Balodaya',
      title_ne: 'सम्पर्क',
      seo_title: `Contact Us · ${SCHOOL_INFO.shortName}`,
      seo_description: 'Reach out to Balodaya Secondary School by phone, email, or visit our campus in Bheerkot-06, Syangja.',
      is_system: 1,
      status: 'published' as const,
      nav_order: 6,
      sections: [
        {
          type: 'contact_block',
          sort_order: 1,
          visible: 1,
          data: {
            title: 'We Look Forward to Hearing From You',
            show_form: true,
            show_map: true,
            show_hours: true,
          },
        },
      ],
    },
  ];

  for (const p of pages) {
    const res = await run(
      `INSERT INTO cms_pages (
        slug, title, title_ne, seo_title, seo_description,
        status, show_in_nav, nav_label, nav_order, is_system, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))`,
      [
        p.slug,
        p.title,
        p.title_ne,
        p.seo_title,
        p.seo_description,
        p.status,
        p.title,
        p.nav_order,
        p.is_system,
      ]
    );

    const pageId = Number(res.lastInsertRowid);

    const sectionStatements = p.sections.map((sec) => ({
      sql: `INSERT INTO cms_sections (page_id, type, sort_order, visible, data)
            VALUES (?, ?, ?, ?, ?)`,
      args: [pageId, sec.type, sec.sort_order, sec.visible, JSON.stringify(sec.data)],
    }));

    await batch(sectionStatements);
  }

  // Seed default site menu
  const menuItems = [
    { zone: 'header', label: 'Home', href: '/', sort_order: 1 },
    { zone: 'header', label: 'About', href: '/about', sort_order: 2 },
    { zone: 'header', label: 'Academics', href: '/academics', sort_order: 3 },
    { zone: 'header', label: 'Admissions', href: '/admissions', sort_order: 4 },
    { zone: 'header', label: 'Facilities', href: '/facilities', sort_order: 5 },
    { zone: 'header', label: 'Gallery', href: '/gallery', sort_order: 6 },
    { zone: 'header', label: 'Contact', href: '/contact', sort_order: 7 },
    { zone: 'footer1', label: 'About Balodaya', href: '/about', sort_order: 1 },
    { zone: 'footer1', label: 'Academics & Houses', href: '/academics', sort_order: 2 },
    { zone: 'footer1', label: 'Campus Facilities', href: '/facilities', sort_order: 3 },
    { zone: 'footer1', label: 'Admission Guidelines', href: '/admissions', sort_order: 4 },
    { zone: 'footer2', label: 'Notices & Circulars', href: '/news', sort_order: 1 },
    { zone: 'footer2', label: 'Photo Gallery', href: '/gallery', sort_order: 2 },
    { zone: 'footer2', label: 'Careers & Tenders', href: '/careers', sort_order: 3 },
    { zone: 'footer2', label: 'Contact School Desk', href: '/contact', sort_order: 4 },
  ];

  for (const m of menuItems) {
    await run(
      `INSERT INTO site_menu (zone, label, href, sort_order, visible)
       VALUES (?, ?, ?, ?, 1)`,
      [m.zone, m.label, m.href, m.sort_order]
    );
  }

  console.log(`Seeded ${pages.length} CMS pages and site menu defaults successfully.`);
  return true;
}
