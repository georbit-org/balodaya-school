import type { CollectionConfig } from 'payload';

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Parent / Visitor Name',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Contact Phone Number',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Inquiry Subject',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: 'Detailed Message',
    },
  ],
};
