import type { CollectionConfig } from 'payload';

export const Facilities: CollectionConfig = {
  slug: 'facilities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Facility Name',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Overview & Technical Infrastructure',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Facility Photograph',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 1,
    },
  ],
};
