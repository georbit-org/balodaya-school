import React from 'react';
import { requirePage } from '@/server/guard';

export default async function KitLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin');
  return <>{children}</>;
}
