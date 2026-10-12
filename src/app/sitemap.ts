import type { MetadataRoute } from 'next';
import { query } from '@/server/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://balodaya.edu.np';

  const defaultRoutes = [
    '',
    '/about',
    '/academics',
    '/admissions',
    '/student-life',
    '/facilities',
    '/gallery',
    '/news',
    '/tenders',
    '/careers',
    '/contact',
  ];

  const dbPages = await query<{ slug: string; updated_at?: string }>(
    "SELECT slug, updated_at FROM cms_pages WHERE status = 'published'"
  ).catch(() => []);

  const routeSet = new Set(defaultRoutes);
  for (const p of dbPages) {
    routeSet.add(p.slug === '' ? '' : `/${p.slug}`);
  }

  return Array.from(routeSet).map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/news' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
