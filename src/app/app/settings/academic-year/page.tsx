'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';

interface YearRow {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: number;
}

export default function AcademicYearSettingsPage() {
  const [years, setYears] = useState<YearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/academic-years');
      if (res.ok) {
        const d = await res.json();
        setYears(d.years || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/settings/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate }),
      });
      if (res.ok) {
        setOpenModal(false);
        setName('');
        setStartDate('');
        setEndDate('');
        loadYears();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create academic year.');
      }
    } catch {
      alert('Error creating year.');
    }
  };

  const handleSetCurrent = async (id: number) => {
    try {
      const res = await fetch(`/api/settings/academic-years/${id}/set-current`, {
        method: 'POST',
      });
      if (res.ok) {
        loadYears();
      }
    } catch {
      alert('Error setting current year.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Academic Year',
      render: (r: YearRow) => <strong>{r.name} B.S.</strong>,
    },
    {
      key: 'dates',
      header: 'Term Dates',
      render: (r: YearRow) => (
        <span>{r.start_date && r.end_date ? `${r.start_date} to ${r.end_date}` : 'Unscheduled'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Current Status',
      render: (r: YearRow) => (
        <span style={{ color: r.is_current ? 'var(--success)' : 'var(--ink-faint)', fontWeight: 600 }}>
          {r.is_current ? 'Active Session' : 'Past / Future'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (r: YearRow) => (
        !r.is_current ? (
          <Button size="sm" variant="secondary" onClick={() => handleSetCurrent(r.id)}>
            Set as Current
          </Button>
        ) : (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)' }}>Current</span>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Configure institutional academic sessions and define the active working calendar."
        actions={
          <Button variant="primary" onClick={() => setOpenModal(true)}>
            + Add Academic Year
          </Button>
        }
      />

      <div style={{ marginTop: 'var(--sp-5)' }}>
        <DataTable columns={columns} rows={years} loading={loading} emptyText="No academic years found." />
      </div>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Add New Academic Year"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Field
            label="Year Name (B.S.)"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2084"
          />

          <Field
            label="Session Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Field
            label="Session End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Academic Year
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
