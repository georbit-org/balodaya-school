import type { CollectionConfig } from 'payload';

export const Leadership: CollectionConfig = {
  slug: 'leadership',
  admin: {
    useAsTitle: 'officerName',
    defaultColumns: ['officerName', 'title'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'officerName',
      type: 'text',
      required: true,
      label: 'Officer Full Name',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Official Designation (e.g. Founder & Chairman / Principal)',
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      label: 'Official Portrait Photograph',
    },
    {
      name: 'greetingSpeech',
      type: 'textarea',
      required: true,
      label: 'Greeting Speech & Institutional Message',
    },
  ],
};
