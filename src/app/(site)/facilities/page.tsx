import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'School Facilities & Infrastructure | Balodaya Secondary English Boarding School',
  description: `Photographic overview of campus facilities, technology infrastructure, and student transport vehicles at Balodaya Secondary School.`,
};

const FACILITIES = [
  {
    image: '/assets/images/vision-mission/building.jpeg',
    caption: 'Main Academic Building & Administrative Block',
    description: 'Multi-story campus block hosting modern classrooms, administrative offices, and library.',
  },
  {
    image: '/assets/images/vision-mission/long.jpg',
    caption: 'Campus Assembly Quadrangle & Playground',
    description: 'Expansive open grounds for daily morning assemblies, drill routines, and sports activities.',
  },
  {
    image: '/assets/images/facilities/Digicamp1.JPG',
    caption: 'Computer Science Laboratory (Digicamp)',
    description: 'Fully networked computer systems enabling practical computing, digital literacy, and programming.',
  },
  {
    image: '/assets/images/facilities/Digicamp2.PNG',
    caption: 'Smart Classroom & Audio-Visual Learning Room',
    description: 'Multimedia audio-visual classroom designed for interactive presentations and digital syllabus delivery.',
  },
  {
    image: '/assets/images/gallery/1/original/1688705352-cocurricular2.jpg',
    caption: 'Science, Mathematics & Project Innovation Hub',
    description: 'Practical project workspace for student experimentation, model building, and science demonstrations.',
  },
  {
    image: '/assets/images/gallery/1/original/1701233092-C4.jpeg',
    caption: 'Auditorium & Cultural Performance Stage',
    description: 'Dedicated stage space for music, drama, annual day functions, and inter-school debates.',
  },
  {
    image: '/assets/images/facilities/transport1.JPG',
    caption: 'School Bus Fleet Route 1 (Bayarghari Corridors)',
    description: 'Dedicated school transit bus covering Bayarghari, Darsing, and local residential pickup points.',
  },
  {
    image: '/assets/images/facilities/transport2.JPG',
    caption: 'School Bus Fleet Route 2 (Waling & Highway Arterials)',
    description: 'Comfortable passenger coach providing reliable round-trip commute across regional bus stops.',
  },
  {
    image: '/assets/images/facilities/transport3.JPG',
    caption: 'Student Transit Fleet Vehicle No. 3',
    description: 'Licensed drivers, speed monitoring, and first-aid equipped transit for student safety.',
  },
  {
    image: '/assets/images/facilities/transport4.JPG',
    caption: 'Campus Transport Depot & Secure Boarding Bay',
    description: 'Gated parking and supervised vehicle boarding area within the school perimeter.',
  },
];

export default function FacilitiesPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>School Facilities</h1>
        <p className={styles.subtitle}>
          Campus infrastructure, educational technology rooms, and student transport fleet at Balodaya Secondary School.
        </p>
      </header>

      <div className={styles.grid}>
        {FACILITIES.map((facility, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.imageWrapper}>
              <Image
                src={facility.image}
                alt={facility.caption}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className={styles.image}
              />
            </div>
            <div className={styles.captionWrapper}>
              <h2 className={styles.caption}>{facility.caption}</h2>
              {facility.description && (
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  {facility.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
