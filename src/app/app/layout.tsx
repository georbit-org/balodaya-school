import React from 'react';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/session';
import { AppShell } from './AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await readSession();

  if (!user) {
    redirect('/login');
  }

  return <AppShell user={user}>{children}</AppShell>;
}
