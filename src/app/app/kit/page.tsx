'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Stat } from '@/components/ui/Stat';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { Heatmap } from '@/components/ui/Heatmap';
import { Section } from '@/components/ui/Section';
import { KeyHint } from '@/components/ui/KeyHint';
import { Timeline } from '@/components/ui/Timeline';
import { Popover } from '@/components/ui/Popover';

export default function UiKitPage() {
  const sampleBars = [
    { label: 'Sun', value: 94 },
    { label: 'Mon', value: 92 },
    { label: 'Tue', value: 89 },
    { label: 'Wed', value: 96 },
    { label: 'Thu', value: 91 },
    { label: 'Fri', value: 88 },
  ];

  const sampleDonut = [
    { label: 'Collected', value: 72, color: 'var(--sky-accent)' },
    { label: 'Partial', value: 16, color: '#F59E0B' },
    { label: 'Overdue', value: 12, color: 'var(--danger)' },
  ];

  const sampleHeatmapDays = Array.from({ length: 30 }, (_, i) => ({
    dayNumber: i + 1,
    dateStr: `2026-10-${String(i + 1).padStart(2, '0')}`,
    status: (i % 7 === 6 ? 'holiday' : i % 11 === 0 ? 'absent' : i % 5 === 0 ? 'late' : 'present') as any,
  }));

  const sampleEvents = [
    {
      id: 1,
      title: 'Fee Payment Received',
      timestamp: '10:42 AM',
      description: 'NPR 14,500 recorded for Aarav Sharma (Class 9A) via Cash',
      meta: 'By Accountant (Ram Shrestha)',
    },
    {
      id: 2,
      title: 'Terminal Marks Published',
      timestamp: 'Yesterday',
      description: 'First Terminal Examination results approved for Class 10',
      meta: 'By Principal',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-8)' }}>
      <PageHeader
        title="UI Kit &amp; Design System Primitives"
        description="Phase 1 verification catalog: hand-crafted icons, charted primitives, tokens, and tactile controls."
        actions={
          <Popover
            trigger={<Button variant="secondary" iconLeft={<Icon name="filter" size={16} />}>Options</Button>}
          >
            {(close) => (
              <div style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>Popover Menu</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Dismisses on Escape or outside click.</p>
                <Button size="sm" onClick={close}>Close</Button>
              </div>
            )}
          </Popover>
        }
      />

      {/* 1. BUTTONS & ICONS */}
      <Section title="Buttons, Key Hints &amp; Status Badges">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <Button variant="primary" iconLeft={<Icon name="plus" size={16} />}>Primary Action</Button>
          <Button variant="secondary" iconLeft={<Icon name="download" size={16} />}>Export Data</Button>
          <Button variant="danger" iconLeft={<Icon name="trash" size={16} />}>Delete Record</Button>
          <Button variant="ghost" iconLeft={<Icon name="refresh" size={16} />}>Refresh</Button>
          <Button loading>Saving</Button>
          <KeyHint>Ctrl</KeyHint> + <KeyHint>K</KeyHint>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', alignItems: 'center' }}>
          <Badge variant="neutral">Neutral Status</Badge>
          <Badge variant="info" dot>Admissions Review</Badge>
          <Badge variant="success" dot>Fee Cleared</Badge>
          <Badge variant="warning" dot>Late Submission</Badge>
          <Badge variant="danger" dot>Overdue Dues</Badge>
        </div>
      </Section>

      {/* 2. STATS WITH SPARKLINE & TREND */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
        <Stat
          label="Enrolled Students"
          value="482"
          subtext="Active learners"
          trend={{ dir: 'up', text: '+4.2%' }}
          sparklineData={[420, 430, 440, 435, 450, 465, 482]}
        />
        <Stat
          label="Attendance Today"
          value="94.2%"
          subtext="5 sections unmarked"
          trend={{ dir: 'down', text: '-1.4%' }}
          sparklineData={[96, 95, 93, 97, 95, 92, 94]}
        />
        <Stat
          label="Monthly Collection"
          value="NPR 3,84,000"
          subtext="72% of target"
          trend={{ dir: 'up', text: '+12%' }}
          sparklineData={[120, 180, 240, 310, 384]}
        />
      </div>

      {/* 3. CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-5)' }}>
        <Section title="Attendance Rate (Last 6 Days)">
          <BarChart data={sampleBars} title="Weekly Attendance" />
        </Section>

        <Section title="Fee Collection Breakdown">
          <DonutChart
            segments={sampleDonut}
            centerValue="72%"
            centerSub="Collected"
          />
        </Section>
      </div>

      {/* 4. HEATMAP & PROGRESS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-5)' }}>
        <Section title="Class 9A Attendance Heatmap (Ashwin 2083)">
          <Heatmap days={sampleHeatmapDays} monthName="Ashwin 2083" />
        </Section>

        <Section title="Operational Progress &amp; Skeletons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink)' }}>Tuition Fee Collection: 76%</span>
              <ProgressBar value={76} variant="accent" style={{ marginTop: 'var(--sp-2)' }} />
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink)' }}>Bus Route Capacity: 92%</span>
              <ProgressBar value={92} variant="warning" style={{ marginTop: 'var(--sp-2)' }} />
            </div>

            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink)', marginTop: 'var(--sp-2)' }}>Loading Skeleton Example</span>
            <Skeleton variant="line" width="60%" />
            <Skeleton variant="line" width="85%" />
            <Skeleton variant="block" height={40} />
          </div>
        </Section>
      </div>

      {/* 5. AVATARS & TIMELINE */}
      <Section title="Student Avatars &amp; Audit Trail">
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
          <Avatar name="Aarav Sharma" size="lg" />
          <Avatar name="Bishnu Pokharel" size="lg" />
          <Avatar name="Sita Aryal" size="lg" />
          <Avatar name="Dipendra Shah" size="lg" />
        </div>
        <Timeline events={sampleEvents} />
      </Section>
    </div>
  );
}
