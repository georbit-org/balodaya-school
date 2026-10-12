import React from 'react';
import { requirePage } from '@/server/guard';

export default async function HeroSlidesLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin', 'principal', 'teacher');
  return <>{children}</>;
}
