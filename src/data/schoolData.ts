export interface SchoolInfo {
  name: string;
  nepaliName: string;
  establishedBS: string;
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
    website: string;
    hours: string;
  };
  motto: string;
  mottoNepali: string;
  leadership: {
    founderAndChairman: {
      name: string;
      title: string;
      image: string;
      message: string;
    };
    principal: {
      name: string;
      title: string;
      image: string;
      message: string;
    };
  };
  originText: string;
  visionText: string;
  missionText: string;
  aboutText: string;
}

export const schoolData: SchoolInfo = {
  name: "Balodaya Secondary English Boarding School",
  nepaliName: "बालोदय माध्यमिक अङ्ग्रेजी बोर्डिङ स्कुल",
  establishedBS: "2063 B.S.",
  location: {
    address: "Sundar Bazar, Bheerkot-06",
    municipality: "Bheerkot Municipality",
    district: "Syangja",
    province: "Gandaki Province",
    country: "Nepal",
  },
  contact: {
    phone: "9846043838",
    email: "balodaya2063@gmail.com",
    website: "https://balodaya.edu.np",
    hours: "Sunday – Friday: 9:00 AM – 4:30 PM (Saturday Closed)",
  },
  motto: "The Need of Education, Civilization of the Nation",
  mottoNepali: "शिक्षाको आवश्यकता, राष्ट्रको सभ्यता",
  leadership: {
    founderAndChairman: {
      name: "Toyanath Aryal",
      title: "Founder & Chairman",
      image: "/assets/images/leadership/chairman.JPG",
      message:
        "Welcome to Balodaya Secondary School, where dreams take flight and futures are shaped. Rooted in a rich history, we're on a journey of inspiration and innovation. Embrace the possibilities, ignite your passion, and let's soar together towards a brighter future!",
    },
    principal: {
      name: "Amrit Aryal",
      title: "Principal",
      image: "/assets/images/leadership/amrit.jpeg",
      message:
        "Welcome to a place where dreams take flight and possibilities are endless! At Balodaya Secondary School, we're not just shaping minds; we're cultivating future leaders, innovators, and compassionate individuals. Each day is an opportunity for greatness, and together, we'll inspire, learn, and triumph. Embrace the journey, for at Balodaya, every student's potential is boundless.",
    },
  },
  originText:
    "In the year 2063 BS, a group of passionate educators in Sunder Bazar, Bheerkot-06, Syangja, came together with a shared dream - to establish Balodaya Secondary School. Fueled by the belief that education is transformative, they opened the doors to a place where history meets the future. Today, Balodaya stands as a testament to their vision, providing quality education and shaping the dreams of the community.",
  visionText:
    "Balodaya Secondary School envisions a dynamic learning community where every student is inspired to reach their full potential. Our vision is to foster holistic development, equipping students with the knowledge, skills, and values needed for success in a rapidly changing world. Through innovative teaching methodologies and a commitment to excellence, we strive to create lifelong learners, critical thinkers, and compassionate individuals who contribute meaningfully to society.",
  missionText:
    "Balodaya Secondary English Boarding School's mission is to inspire a love for learning, cultivate character, and promote innovation. We encourage students to explore their passions while building a supportive and inclusive community. Our goal is to equip students with the skills and values needed for success in a rapidly changing world, fostering responsible global citizens who contribute positively to society.",
  aboutText:
    "Established in the year 2063 BS, Balodaya Secondary School stands as a beacon of educational excellence in the heart of Sundar Bazar, Bheerkot-06, Syangja. Nestled in the scenic beauty of the region, our school is proud to be an integral part of the vibrant Bheerkot Municipality. From Kindergarten to Grade 10, we provide a comprehensive educational journey that focuses on intellectual, social, and emotional development.",
};
