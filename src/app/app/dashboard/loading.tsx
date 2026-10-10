import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-8)' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <Skeleton variant="line" width="220px" height="28px" />
        <Skeleton variant="line" width="380px" height="14px" />
      </div>

      {/* 4 Stat card skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
      </div>

      {/* Chart blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-5)' }}>
        <Skeleton variant="block" height="220px" />
        <Skeleton variant="block" height="220px" />
      </div>

      {/* Table rows skeleton */}
      <Skeleton variant="tableRows" rows={4} />
    </div>
  );
}
