'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { SearchBox } from '@/components/ui/SearchBox';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export default function KitPreviewPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const { showToast } = useToast();

  const demoRows = [
    { id: 1, name: 'Shiva Aryal', role: 'Head Boy', status: 'Active' },
    { id: 2, name: 'Prasamsha Aryal', role: 'Head Girl', status: 'Active' },
  ];

  const demoColumns = [
    { key: 'id', header: 'ID', width: '60px' },
    { key: 'name', header: 'Student Name' },
    { key: 'role', header: 'Post' },
    {
      key: 'status',
      header: 'Status',
      render: (r: { status: string }) => (
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.status}</span>
      ),
    },
  ];

  return (
    <div className="container" style={{ padding: 'var(--sp-6) var(--gutter)' }}>
      <PageHeader
        title="UI Kit Component Catalog"
        description="Design system tokens and reusable building blocks adhering strictly to light-blue and zero-generic rules."
        actions={
          <Button onClick={() => showToast('Toast notification works!', 'success')}>
            Test Toast
          </Button>
        }
      />

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
          <Stat label="Total Enrolled" value="480" subtext="Session 2083/84" />
          <Stat label="Attendance Today" value="96.4%" subtext="462 Present" />
          <Stat label="Published Circulars" value="18" href="/news" />
        </div>
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Fields</h2>
        <div style={{ maxWidth: '440px' }}>
          <Field label="Student Full Name" placeholder="e.g. Shiva Aryal" required />
          <Field label="Guardian Phone" placeholder="98XXXXXXXX" hint="Emergency contact mobile number" />
          <Field label="Email Address" error="Please enter a valid email format." />
          <Field
            as="select"
            label="Class Enrollment"
            options={[
              { value: 'class-9', label: 'Class 9' },
              { value: 'class-10', label: 'Class 10' },
            ]}
          />
          <Field as="textarea" label="Notes & Remarks" placeholder="Additional details..." />
        </div>
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Tabs &amp; Data Table</h2>
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Active Roster' },
            { id: 'tab2', label: 'Pending Applications' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={demoColumns} rows={demoRows as any} />
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Modals &amp; Destructive Actions</h2>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <Button onClick={() => setDialogOpen(true)} variant="secondary">
            Open Sample Dialog
          </Button>
          <ConfirmButton
            confirmTitle="Delete Record"
            confirmMessage="Are you sure you want to delete this operational item? This action is recorded in the audit log."
            onConfirm={() => showToast('Action confirmed and completed.', 'info')}
          >
            Confirm Delete
          </ConfirmButton>
        </div>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Sample Information Dialog">
          <p>
            This modal includes automatic keyboard focus trapping, Esc dismissal, and clean light-blue token elevations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-4)' }}>
            <Button onClick={() => setDialogOpen(false)}>Close Dialog</Button>
          </div>
        </Dialog>
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2>Search &amp; Empty State</h2>
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <SearchBox placeholder="Search records by name or roll number…" />
        </div>
        <EmptyState
          title="No applications pending"
          description="All prospective candidate applications for academic session 2083/84 have been processed."
        />
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </section>
    </div>
  );
}
