'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { SessionUser } from '@/server/session';
import { can as checkCan, type Action, type Role } from '@/lib/permissions';

interface SessionContextValue {
  user: SessionUser;
  role: Role;
  can: (action: Action) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const value = useMemo<SessionContextValue>(() => {
    return {
      user,
      role: user.role,
      can: (action: Action) => checkCan(user.role, action),
    };
  }, [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}

export function Can({
  action,
  children,
  fallback = null,
}: {
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can } = useSession();
  if (!can(action)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
