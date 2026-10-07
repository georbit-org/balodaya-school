export interface SchoolInfo {
  name: string;
  shortName: string;
  establishedBS: string;
  motto: string;
  mottoNepali?: string;
  location: {
    address: string;
    municipality: string;
    district: string;
    province: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  logo: string;
  quotes: string[];
  originText: string;
  visionText: string;
  missionText: string;
  aboutText: string;
}

export const SCHOOL_INFO: SchoolInfo = {
  name: 'Balodaya Secondary English Boarding School',
  shortName: 'Balodaya School',
  establishedBS: '2063 B.S.',
  motto: 'The Need of Education, Civilization of the Nation',
  location: {
    address: 'Sundar Bazar, Bheerkot-06',
    municipality: 'Bheerkot Municipality',
    district: 'Syangja',
    province: 'Gandaki Province',
    country: 'Nepal',
  },
  contact: {
    phone: '9846043838',
    email: 'balodaya2063@gmail.com',
  },
  logo: '/assets/images/logo.png',
  quotes: [
    'Time never waits',
    'Failure is the step to success',
    'Hard work beats the talent',
    'Future belongs to us',
    'Education is the greatest weapon',
  ],
  originText:
    'In the year 2063 BS, a group of passionate educators in Sunder Bazar, Bheerkot-06, Syangja, came together with a shared dream - to establish Balodaya Secondary School. Fueled by the belief that education is transformative, they opened the doors to a place where history meets the future. Today, Balodaya stands as a testament to their vision, providing quality education and shaping the dreams of the community.',
  visionText:
    'Balodaya Secondary School envisions a dynamic learning community where every student is inspired to reach their full potential. Our vision is to foster holistic development, equipping students with the knowledge, skills, and values needed for success in a rapidly changing world. Through innovative teaching methodologies and a commitment to excellence, we strive to create lifelong learners, critical thinkers, and compassionate individuals who contribute meaningfully to society.',
  missionText:
    "Balodaya Secondary English Boarding School's mission is to inspire a love for learning, cultivate character, and promote innovation. We encourage students to explore their passions while building a supportive and inclusive community. Our goal is to equip students with the skills and values needed for success in a rapidly changing world, fostering responsible global citizens who contribute positively to society.",
  aboutText:
    'Established in the year 2063 BS, Balodaya Secondary School stands as a beacon of educational excellence in the heart of Sundar Bazar, Bheerkot-06, Syangja. Nestled in the scenic beauty of the region, our school is proud to be an integral part of the vibrant Bheerkot Municipality. At Balodaya, we believe in nurturing young minds and empowering them to reach their full potential. Our commitment to academic excellence, combined with a holistic approach to education, sets us apart as one of the best schools in Bheerkot Municipality. We provide a comprehensive educational journey that focuses on intellectual, social, and emotional development. Our dedicated team of experienced educators is passionate about creating a positive and inspiring learning environment. We strive to instill a love for learning in our students, encouraging them to explore their interests and cultivate critical thinking skills. Through a blend of traditional values and modern teaching methodologies, we aim to prepare our students for the challenges of the ever-evolving global landscape. As we continue to evolve and adapt to the changing educational landscape, Balodaya Secondary School remains steadfast in its mission to provide quality education and shape the future leaders of tomorrow. Join us on this exciting journey of learning and discovery at Balodaya Secondary School, where every day is an opportunity to grow, learn, and succeed.',
};
