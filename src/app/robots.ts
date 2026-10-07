import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/login', '/api/'],
    },
    sitemap: 'https://balodaya.edu.np/sitemap.xml',
  };
}
