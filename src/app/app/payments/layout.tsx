import React from 'react';
import { requirePage } from '@/server/guard';

export default async function PaymentsLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin', 'accountant');
  return <>{children}</>;
}
