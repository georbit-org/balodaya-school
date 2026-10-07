import type { CollectionConfig } from 'payload';

export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'badge', 'order', 'active'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Slide Headline',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Slide Subtitle',
    },
    {
      name: 'badge',
      type: 'text',
      label: 'Category Tag / Badge',
      defaultValue: 'Academic Excellence · Kindergarten to Grade 10',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Photo Upload',
    },
    {
      name: 'imageUrlFallback',
      type: 'text',
      label: 'Direct Photo Path (e.g. /assets/images/...)',
    },
    {
      name: 'primaryButtonLabel',
      type: 'text',
      label: 'Primary Button Label',
      defaultValue: 'Apply for Admission 2083/84',
    },
    {
      name: 'primaryButtonLink',
      type: 'text',
      label: 'Primary Button Link',
      defaultValue: '/admissions',
    },
    {
      name: 'secondaryButtonLabel',
      type: 'text',
      label: 'Secondary Button Label',
      defaultValue: 'Explore Academics',
    },
    {
      name: 'secondaryButtonLink',
      type: 'text',
      label: 'Secondary Button Link',
      defaultValue: '/academics',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order (1, 2, 3...)',
      defaultValue: 1,
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active (Visible on Homepage Carousel)',
      defaultValue: true,
    },
  ],
};
