import type { CollectionConfig } from 'payload';

export const Notices: CollectionConfig = {
  slug: 'notices',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'pinned'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Notice Title',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'General',
      options: [
        { label: 'Admissions & Enrollment', value: 'Admissions' },
        { label: 'Academic Programs', value: 'Academics' },
        { label: 'Examinations (SEE)', value: 'Examinations' },
        { label: 'Events & Programs', value: 'Events' },
        { label: 'General Circular', value: 'General' },
      ],
      label: 'Category',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      label: 'Issue Date',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Notice Full Body',
    },
    {
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
      label: 'Official PDF Attachment',
    },
    {
      name: 'pinned',
      type: 'checkbox',
      label: 'Pin to Homepage Ledger',
      defaultValue: false,
    },
  ],
};
