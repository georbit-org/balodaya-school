import React from 'react';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/session';
import { SessionProvider } from '@/components/auth/SessionProvider';
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

  return (
    <SessionProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </SessionProvider>
  );
}
