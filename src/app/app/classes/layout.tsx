import React from 'react';
import { requirePage } from '@/server/guard';

export default async function ClassesLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin', 'principal');
  return <>{children}</>;
}
