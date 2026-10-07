import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://balodaya.edu.np';
  const routes = [
    '',
    '/about',
    '/academics',
    '/admissions',
    '/student-life',
    '/facilities',
    '/gallery',
    '/news',
    '/students/results',
    '/students/resources',
    '/students/exam-timetable',
    '/students/transfer-certificate',
    '/students/alumni',
    '/students/testimonials',
    '/tenders',
    '/careers',
    '/contact',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/news' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/students') ? 0.7 : 0.8,
  }));
}
