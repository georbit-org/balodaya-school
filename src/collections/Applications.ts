import type { CollectionConfig } from 'payload';

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'studentName',
    defaultColumns: ['studentName', 'grade', 'parentName', 'phone', 'status'],
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'studentName',
      type: 'text',
      required: true,
      label: 'Applicant Student Full Name',
    },
    {
      name: 'grade',
      type: 'text',
      required: true,
      label: 'Desired Academic Grade (Nursery – Grade 10)',
    },
    {
      name: 'parentName',
      type: 'text',
      required: true,
      label: 'Parent / Guardian Full Name',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Primary Phone Number',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'Pending',
      options: [
        { label: 'Pending Review', value: 'Pending' },
        { label: 'Interview Scheduled', value: 'Interviewed' },
        { label: 'Admitted / Enrolled', value: 'Enrolled' },
        { label: 'Archived', value: 'Archived' },
      ],
      label: 'Admission Status',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Office Evaluation Notes',
    },
  ],
};
