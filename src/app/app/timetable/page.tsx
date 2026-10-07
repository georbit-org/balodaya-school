'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import styles from './Timetable.module.css';

interface SlotData {
  id: number;
  section_id: number;
  day_of_week: number;
  period: number;
  subject_id: number | null;
  subject_name: string | null;
  teacher_id: number | null;
  teacher_name: string | null;
}

const DAYS = [
  { index: 0, name: 'Sunday' },
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
  const [sections, setSections] = useState<{ id: number; classId: number; label: string }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);

  // Subjects & Teachers options
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([]);

  // Dialog State
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number; slot: SlotData | null } | null>(null);
  const [cellForm, setCellForm] = useState({
    subject_id: '',
    teacher_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [collisionError, setCollisionError] = useState('');

  // Load sections and teachers
  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const opts: { id: number; classId: number; label: string }[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({ id: sec.id, classId: cls.id, label: `${cls.name} (${sec.name})` });
          }
        }
        setSections(opts);
        if (opts.length > 0 && !selectedSectionId) {
          setSelectedSectionId(String(opts[0].id));
        }
      })
      .catch(() => {});

    fetch('/api/users?role=teacher')
      .then((r) => r.json())
      .then((d) => {
        setTeachers((d.items || []).map((u: { id: number; name: string }) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, [selectedSectionId]);

  // Load subjects for the current section's class
  useEffect(() => {
    if (!selectedSectionId) return;
    const sec = sections.find((s) => s.id === parseInt(selectedSectionId, 10));
    if (!sec) return;

    fetch(`/api/classes/${sec.classId}/subjects`)
      .then((r) => r.json())
      .then((d) => {
        setSubjects((d.subjects || []).map((s: { subject_id: number; subject_name: string }) => ({
          id: s.subject_id,
          name: s.subject_name,
        })));
      })
      .catch(() => {});
  }, [selectedSectionId, sections]);

  // Load timetable slots
  const loadSlots = useCallback(async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?section_id=${selectedSectionId}`);
      if (res.ok) {
        const d = await res.json();
        setSlots(d.slots || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSectionId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleCellClick = (day: number, period: number) => {
    const existing = slots.find((s) => s.day_of_week === day && s.period === period) || null;
    setSelectedCell({ day, period, slot: existing });
    setCellForm({
      subject_id: existing?.subject_id ? String(existing.subject_id) : '',
      teacher_id: existing?.teacher_id ? String(existing.teacher_id) : '',
    });
    setCollisionError('');
  };

  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !selectedSectionId) return;
    setCollisionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/timetable/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: parseInt(selectedSectionId, 10),
          day_of_week: selectedCell.day,
          period: selectedCell.period,
          subject_id: cellForm.subject_id ? parseInt(cellForm.subject_id, 10) : null,
          teacher_id: cellForm.teacher_id ? parseInt(cellForm.teacher_id, 10) : null,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setCollisionError(d.error || 'Failed to update timetable slot.');
        return;
      }

      setSelectedCell(null);
      loadSlots();
    } catch {
      setCollisionError('Network error while updating slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSlot = async () => {
    if (!selectedCell || !selectedSectionId) return;
    setSubmitting(true);
    try {
      await fetch('/api/timetable/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: parseInt(selectedSectionId, 10),
          day_of_week: selectedCell.day,
          period: selectedCell.period,
          subject_id: null,
          teacher_id: null,
        }),
      });
      setSelectedCell(null);
      loadSlots();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Weekly Academic Timetable"
        description="Class and section period rosters with collision detection preventing double-booked instructors."
      />

      <div className={styles.controlBar}>
        <div className={styles.selectGroup}>
          <label htmlFor="timetable-sec-select">Class Section:</label>
          <select
            id="timetable-sec-select"
            className={styles.selectInput}
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
          Click any cell to schedule subject and instructor.
        </span>
      </div>

      <div className={styles.gridWrapper}>
        <table className={styles.timetableTable}>
          <thead>
            <tr>
              <th className={styles.dayHeader}>Day</th>
              {PERIODS.map((p) => (
                <th key={p}>Period {p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => (
              <tr key={d.index}>
                <td className={styles.dayHeader}>{d.name}</td>
                {PERIODS.map((p) => {
                  const slot = slots.find((s) => s.day_of_week === d.index && s.period === p);
                  return (
                    <td key={p} onClick={() => handleCellClick(d.index, p)}>
                      <div className={styles.cellCard}>
                        {slot && slot.subject_name ? (
                          <>
                            <div className={styles.cellSubject}>{slot.subject_name}</div>
                            {slot.teacher_name && (
                              <div className={styles.cellTeacher}>{slot.teacher_name}</div>
                            )}
                          </>
                        ) : (
                          <div className={styles.cellEmpty}>+ Assign</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Slot Dialog */}
      <Dialog
        open={selectedCell !== null}
        onClose={() => setSelectedCell(null)}
        title={
          selectedCell
            ? `${DAYS.find((d) => d.index === selectedCell.day)?.name} — Period ${selectedCell.period}`
            : 'Schedule Slot'
        }
      >
        <form onSubmit={handleSaveCell} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {collisionError && (
            <div style={{ padding: 'var(--space-3)', background: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              ⚠ {collisionError}
            </div>
          )}

          <Field
            label="Subject"
            as="select"
            value={cellForm.subject_id}
            onChange={(e) => setCellForm({ ...cellForm, subject_id: e.target.value })}
          >
            <option value="">None (Empty / Free Period)</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Field>

          <Field
            label="Instructor / Teacher"
            as="select"
            value={cellForm.teacher_id}
            onChange={(e) => setCellForm({ ...cellForm, teacher_id: e.target.value })}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Field>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            {selectedCell?.slot && (
              <Button variant="secondary" type="button" onClick={handleClearSlot} disabled={submitting}>
                Clear Slot
              </Button>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto' }}>
              <Button variant="secondary" type="button" onClick={() => setSelectedCell(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
