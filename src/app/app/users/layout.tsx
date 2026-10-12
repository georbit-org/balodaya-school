import React from 'react';
import { requirePage } from '@/server/guard';

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await requirePage('admin');
  return <>{children}</>;
}
