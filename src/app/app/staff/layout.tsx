import React from 'react';
import { requirePage } from '@/server/guard';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin', 'principal');
  return <>{children}</>;
}
