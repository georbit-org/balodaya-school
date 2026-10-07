'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';

interface GradeRow {
  id: number;
  min_percent: number;
  grade: string;
  gpa: number;
}

export default function GradeScaleSettingsPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/grade-scale')
      .then((res) => res.json())
      .then((d) => setGrades(d.grades || []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'grade',
      header: 'Letter Grade',
      render: (r: GradeRow) => <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--accent)' }}>{r.grade}</strong>,
    },
    {
      key: 'gpa',
      header: 'Grade Point (GPA)',
      render: (r: GradeRow) => <span>{r.gpa.toFixed(1)}</span>,
    },
    {
      key: 'min_percent',
      header: 'Minimum Percentage Range',
      render: (r: GradeRow) => <span>{r.min_percent}% and above</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grading Scale &amp; GPA Framework"
        description="Official grading bands aligned with NEB/SEE evaluation standards for academic transcripts and terminal reports."
      />

      <div style={{ marginTop: 'var(--sp-5)' }}>
        <DataTable columns={columns} rows={grades} loading={loading} emptyText="No grade scale rows configured." />
      </div>
    </div>
  );
}
