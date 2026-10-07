import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/history.html',
        destination: '/about#origin',
        permanent: true,
      },
      {
        source: '/vision-mision.html',
        destination: '/about#vision',
        permanent: true,
      },
      {
        source: '/leadership.html',
        destination: '/about#leadership',
        permanent: true,
      },
      {
        source: '/houses.html',
        destination: '/student-life#houses',
        permanent: true,
      },
      {
        source: '/council-leader.html',
        destination: '/student-life#leaders',
        permanent: true,
      },
      {
        source: '/photo-gallery.html',
        destination: '/gallery',
        permanent: true,
      },
      {
        source: '/video-gallery.html',
        destination: '/gallery',
        permanent: true,
      },
      {
        source: '/vacancies.html',
        destination: '/careers',
        permanent: true,
      },
      {
        source: '/contactus.html',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/portal',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/portal/:path*',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
