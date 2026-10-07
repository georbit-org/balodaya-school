export interface HouseInfo {
  name: 'Red' | 'Yellow' | 'Blue' | 'Green' | 'Orange';
  colorToken: string;
  motto: string;
}

export const HOUSES_INTRO =
  'The houses at our school are more than just groups; they are vibrant communities that embody values, foster teamwork, and inspire excellence. Each house is a unique family, contributing to the colorful tapestry of our school spirit. Together, we celebrate diversity, nurture talents, and create a sense of belonging that lasts a lifetime.';

export const HOUSES_INFO: HouseInfo[] = [
  {
    name: 'Red',
    colorToken: 'var(--house-red)',
    motto: 'Igniting Passion, Fostering Unity, and Achieving Excellence!',
  },
  {
    name: 'Yellow',
    colorToken: 'var(--house-yellow)',
    motto: 'Radiant Minds, Unified Hearts, Limitless Horizons!',
  },
  {
    name: 'Blue',
    colorToken: 'var(--house-blue)',
    motto: 'Soaring Beyond Boundaries, Uniting in Excellence!',
  },
  {
    name: 'Green',
    colorToken: 'var(--house-green)',
    motto: 'Growing Together, Sowing Seeds of Success',
  },
  {
    name: 'Orange',
    colorToken: 'var(--house-orange)',
    motto: 'Blaze of Brilliance, Uniting in Triumph!',
  },
];

export const HOUSES_PHOTOS = [
  '/assets/images/houses/top.jpeg',
  '/assets/images/houses/houses_banner1.JPG',
  '/assets/images/houses/prize1.jpeg',
  '/assets/images/houses/prize2.jpeg',
  '/assets/images/houses/eca.jpeg',
  '/assets/images/council_leader_page/winning.jpeg',
];
