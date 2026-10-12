import React from 'react';
import { requirePage } from '@/server/guard';

export default async function AcademicYearLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin');
  return <>{children}</>;
}
