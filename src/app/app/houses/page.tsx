'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useSession } from '@/components/auth/SessionProvider';
import styles from './Houses.module.css';

interface HouseItem {
  id: number;
  name: string;
  motto: string;
  total_points: number;
  student_count: number;
}

interface PointLogItem {
  id: number;
  house_id: number;
  house_name: string;
  points: number;
  reason: string;
  awarded_on: string;
  awarded_by_name: string | null;
}

const HOUSE_COLORS: Record<string, string> = {
  Red: '#dc2626',
  Yellow: '#eab308',
  Blue: '#2563eb',
  Green: '#16a34a',
  Orange: '#ea580c',
};

export default function HousesManagementPage() {
  const { can } = useSession();
  const canAward = can('house.award_points');

  const [houses, setHouses] = useState<HouseItem[]>([]);
  const [logs, setLogs] = useState<PointLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Award Points Dialog
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({
    house_id: '',
    points: 10,
    reason: '',
    awarded_on: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, lRes] = await Promise.all([
        fetch('/api/houses'),
        fetch('/api/houses/points'),
      ]);

      if (hRes.ok) {
        const hd = await hRes.json();
        setHouses(hd.houses || []);
      }
      if (lRes.ok) {
        const ld = await lRes.json();
        setLogs(ld.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/houses/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(awardForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to award points');

      setIsAwardOpen(false);
      setAwardForm({
        house_id: '',
        points: 10,
        reason: '',
        awarded_on: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error submitting points');
    } finally {
      setSubmitting(false);
    }
  };

  const logColumns: Column<PointLogItem>[] = [
    {
      key: 'house_name',
      label: 'House',
      render: (l) => (
        <span style={{ fontWeight: 600, color: HOUSE_COLORS[l.house_name] || 'inherit' }}>
          {l.house_name} House
        </span>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (l) => (
        <span className={l.points >= 0 ? styles.ptsPositive : styles.ptsNegative}>
          {l.points > 0 ? `+${l.points}` : l.points}
        </span>
      ),
    },
    { key: 'reason', label: 'Reason / Citation' },
    { key: 'awarded_on', label: 'Date' },
    { key: 'awarded_by_name', label: 'Awarded By', render: (l) => l.awarded_by_name || 'Faculty' },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Collegiate Houses & Leaderboard"
        description="House standings, point awards for co-curricular competitions, and student house rosters."
        actions={
          canAward ? (
            <Button
              variant="primary"
              onClick={() => {
                setAwardForm({
                  house_id: houses.length > 0 ? String(houses[0].id) : '',
                  points: 10,
                  reason: '',
                  awarded_on: new Date().toISOString().split('T')[0],
                });
                setFormError('');
                setIsAwardOpen(true);
              }}
            >
              + Award / Deduct Points
            </Button>
          ) : undefined
        }
      />

      {/* Leaderboard Cards */}
      <div className={styles.leaderboardGrid}>
        {houses.map((house, idx) => {
          const color = HOUSE_COLORS[house.name] || 'var(--accent)';
          return (
            <div
              key={house.id}
              className={styles.houseCard}
              style={{ borderLeftColor: color }}
            >
              <span className={styles.rankBadge}>#{idx + 1}</span>
              <h2 className={styles.houseName}>{house.name} House</h2>
              <div>
                <span className={styles.pointsValue}>{house.total_points}</span>
                <span className={styles.pointsLabel}> pts</span>
              </div>
              <p className={styles.houseMotto}>&ldquo;{house.motto}&rdquo;</p>
              <div className={styles.houseMeta}>
                {house.student_count} students enrolled
              </div>
            </div>
          );
        })}
      </div>

      {/* Points History Table */}
      <div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--sp-3)' }}>
          Recent House Points Log
        </h2>
        <DataTable
          columns={logColumns}
          rows={logs}
          loading={loading}
          emptyText="No house points awarded yet. Points awarded will appear here."
        />
      </div>

      {/* Award Points Dialog */}
      <Dialog
        open={isAwardOpen}
        onClose={() => setIsAwardOpen(false)}
        title="Award or Deduct House Points"
      >
        <form onSubmit={handleAwardPoints} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <Field label="Target House *" required>
            <select
              required
              value={awardForm.house_id}
              onChange={(e) => setAwardForm({ ...awardForm, house_id: e.target.value })}
            >
              <option value="">-- Choose House --</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} House (Current: {h.total_points} pts)
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
            <Field label="Points (+ / -) *" required>
              <input
                type="number"
                required
                value={awardForm.points}
                onChange={(e) => setAwardForm({ ...awardForm, points: parseInt(e.target.value, 10) || 0 })}
                placeholder="e.g. 10 or -5"
              />
            </Field>
            <Field label="Date Awarded *" required>
              <input
                type="date"
                required
                value={awardForm.awarded_on}
                onChange={(e) => setAwardForm({ ...awardForm, awarded_on: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Reason / Citation *" required>
            <textarea
              required
              rows={3}
              value={awardForm.reason}
              onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
              placeholder="e.g. First prize in Interschool English Debate Competition"
            />
          </Field>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsAwardOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm Points'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
