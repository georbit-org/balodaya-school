import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'schoolName',
      type: 'text',
      required: true,
      defaultValue: 'Balodaya Secondary English Boarding School',
      label: 'School Name (English)',
    },
    {
      name: 'schoolNepaliName',
      type: 'text',
      defaultValue: 'बालोदय माध्यमिक अङ्ग्रेजी बोर्डिङ स्कुल',
      label: 'School Name (Nepali)',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Official Crest / Logo',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      defaultValue: '9846043838',
      label: 'Main Office Phone Number',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      defaultValue: 'balodaya2063@gmail.com',
      label: 'Official Email Address',
    },
    {
      name: 'address',
      type: 'text',
      required: true,
      defaultValue: 'Sundar Bazar, Bheerkot-06, Syangja, Nepal',
      label: 'Campus Physical Address',
    },
    {
      name: 'officeHours',
      type: 'text',
      defaultValue: 'Sunday – Friday: 9:00 AM – 4:30 PM (Saturday Closed)',
      label: 'Office Working Hours',
    },
    {
      name: 'motto',
      type: 'text',
      defaultValue: 'The Need of Education, Civilization of the Nation',
      label: 'School Motto (English)',
    },
    {
      name: 'mottoNepali',
      type: 'text',
      defaultValue: 'शिक्षाको आवश्यकता, राष्ट्रको सभ्यता',
      label: 'School Motto (Nepali)',
    },
  ],
};
