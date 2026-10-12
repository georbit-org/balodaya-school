import React from 'react';
import { requirePage } from '@/server/guard';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin', 'principal', 'teacher', 'accountant');
  return <>{children}</>;
}
