'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Exams.module.css';

interface ExamItem {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  published: number;
  public_results: number;
  academic_year_name: string;
}

interface StudentGridRow {
  enrollment_id: number;
  student_id: number;
  admission_no: string;
  full_name: string;
  roll_no: number | null;
  marks: number | null;
}

interface ComputedResultRow {
  student_id: number;
  enrollment_id: number;
  admission_no: string;
  student_name: string;
  roll_no: number | null;
  total_obtained: number;
  total_full_marks: number;
  percentage: number;
  result: 'Pass' | 'Fail';
  gpa: number;
  rank: number | null;
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    obtained: number | null;
    grade: string;
    passed: boolean;
  }>;
}

export default function ExamsManagementPage() {
  const [view, setView] = useState<'list' | 'entry' | 'results'>('list');

  // Exams List
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    public_results: false,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Active selections
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const [sections, setSections] = useState<{ id: number; classId: number; label: string }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Marks Entry Grid State
  const [gridSubject, setGridSubject] = useState<{ full_marks: number; pass_marks: number } | null>(null);
  const [gridStudents, setGridStudents] = useState<StudentGridRow[]>([]);
  const [marksState, setMarksState] = useState<Record<number, string>>({});
  const [gridLoading, setGridLoading] = useState(false);
  const [gridSaving, setGridSaving] = useState(false);
  const [gridMessage, setGridMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Results Ledger State
  const [ledgerResults, setLedgerResults] = useState<ComputedResultRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Load exams
  const loadExams = useCallback(async () => {
    setExamsLoading(true);
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const d = await res.json();
        const items = d.items || [];
        setExams(items);
        if (items.length > 0 && !activeExamId) {
          setActiveExamId(items[0].id);
        }
      }
    } finally {
      setExamsLoading(false);
    }
  }, [activeExamId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Load sections
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
  }, [selectedSectionId]);

  // Load subjects when section changes
  useEffect(() => {
    if (!selectedSectionId) return;
    const secObj = sections.find((s) => s.id === parseInt(selectedSectionId, 10));
    if (!secObj) return;

    fetch(`/api/classes/${secObj.classId}/subjects`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.subjects || []).map((s: { subject_id: number; subject_name: string }) => ({
          id: s.subject_id,
          name: s.subject_name,
        }));
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubjectId(String(list[0].id));
        } else {
          setSelectedSubjectId('');
        }
      })
      .catch(() => {});
  }, [selectedSectionId, sections]);

  // Load marks grid
  const loadMarksGrid = useCallback(async () => {
    if (!activeExamId || !selectedSectionId || !selectedSubjectId) return;
    setGridLoading(true);
    setGridMessage(null);
    try {
      const res = await fetch(
        `/api/exams/${activeExamId}/marks?section_id=${selectedSectionId}&subject_id=${selectedSubjectId}`
      );
      if (res.ok) {
        const d = await res.json();
        setGridSubject(d.subject);
        setGridStudents(d.students || []);
        const initialMap: Record<number, string> = {};
        for (const st of d.students || []) {
          initialMap[st.enrollment_id] = st.marks !== null ? String(st.marks) : '';
        }
        setMarksState(initialMap);
      }
    } finally {
      setGridLoading(false);
    }
  }, [activeExamId, selectedSectionId, selectedSubjectId]);

  // Load results ledger
  const loadResultsLedger = useCallback(async () => {
    if (!activeExamId || !selectedSectionId) return;
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/exams/${activeExamId}/results?section_id=${selectedSectionId}`);
      if (res.ok) {
        const d = await res.json();
        setLedgerResults(d.results || []);
      }
    } finally {
      setLedgerLoading(false);
    }
  }, [activeExamId, selectedSectionId]);

  useEffect(() => {
    if (view === 'entry') {
      loadMarksGrid();
    } else if (view === 'results') {
      loadResultsLedger();
    }
  }, [view, loadMarksGrid, loadResultsLedger]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setCreateForm({ name: '', start_date: '', end_date: '', public_results: false });
        loadExams();
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleTogglePublish = async (exam: ExamItem) => {
    const nextVal = exam.published ? 0 : 1;
    await fetch(`/api/exams/${exam.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: nextVal }),
    });
    loadExams();
  };

  const handleSaveMarks = async () => {
    if (!activeExamId || !selectedSectionId || !selectedSubjectId || !gridSubject) return;
    setGridSaving(true);
    setGridMessage(null);

    // Validate entries
    for (const st of gridStudents) {
      const val = marksState[st.enrollment_id];
      if (val !== '' && val !== undefined) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > gridSubject.full_marks) {
          setGridMessage({
            type: 'error',
            text: `Invalid mark for ${st.full_name}: must be between 0 and ${gridSubject.full_marks}.`,
          });
          setGridSaving(false);
          return;
        }
      }
    }

    const payload = {
      section_id: parseInt(selectedSectionId, 10),
      subject_id: parseInt(selectedSubjectId, 10),
      marks: gridStudents.map((st) => ({
        enrollment_id: st.enrollment_id,
        marks: marksState[st.enrollment_id] !== '' ? Number(marksState[st.enrollment_id]) : null,
      })),
    };

    try {
      const res = await fetch(`/api/exams/${activeExamId}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setGridMessage({ type: 'success', text: 'Marks saved successfully.' });
        loadMarksGrid();
      } else {
        const err = await res.json();
        setGridMessage({ type: 'error', text: err.error || 'Failed to save marks.' });
      }
    } catch {
      setGridMessage({ type: 'error', text: 'Network error while saving marks.' });
    } finally {
      setGridSaving(false);
    }
  };

  const examColumns: Column<ExamItem>[] = [
    { key: 'name', header: 'Exam Title', render: (e: ExamItem) => <strong>{e.name}</strong> },
    { key: 'year', header: 'Academic Year', render: (e: ExamItem) => e.academic_year_name },
    {
      key: 'dates',
      header: 'Schedule',
      render: (e: ExamItem) =>
        e.start_date ? `${e.start_date} ${e.end_date ? `to ${e.end_date}` : ''}` : 'Not scheduled',
    },
    {
      key: 'status',
      header: 'Publication Status',
      render: (e: ExamItem) =>
        e.published ? (
          <span className={styles.badgePublished}>Published</span>
        ) : (
          <span className={styles.badgeDraft}>Draft (Unpublished)</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: ExamItem) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActiveExamId(e.id);
              setView('entry');
            }}
          >
            Enter Marks
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActiveExamId(e.id);
              setView('results');
            }}
          >
            View Results
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(e)}>
            {e.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      ),
    },
  ];

  const ledgerColumns: Column<ComputedResultRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      render: (r: ComputedResultRow) => (r.rank !== null ? <strong>#{r.rank}</strong> : '—'),
    },
    { key: 'roll_no', header: 'Roll', render: (r: ComputedResultRow) => r.roll_no ?? '—' },
    { key: 'student_name', header: 'Student Name', render: (r: ComputedResultRow) => r.student_name },
    {
      key: 'total',
      header: 'Total Marks',
      render: (r: ComputedResultRow) => `${r.total_obtained} / ${r.total_full_marks}`,
    },
    { key: 'percentage', header: 'Percentage', render: (r: ComputedResultRow) => `${r.percentage}%` },
    { key: 'gpa', header: 'GPA', render: (r: ComputedResultRow) => <strong>{r.gpa.toFixed(2)}</strong> },
    {
      key: 'result',
      header: 'Result',
      render: (r: ComputedResultRow) =>
        r.result === 'Pass' ? (
          <span className={styles.badgePass}>Pass</span>
        ) : (
          <span className={styles.badgeFail}>Fail</span>
        ),
    },
    {
      key: 'print',
      header: 'Marksheet',
      render: (r: ComputedResultRow) => (
        <Link href={`/app/print/marksheet/${activeExamId}-${r.student_id}`} target="_blank">
          <Button variant="secondary" size="sm">
            Print Marksheet
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Examinations & Marks Ledger"
        description="Term examination schedules, spreadsheet marks entry, GPA calculations, and official marksheets."
        actions={
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            + Create New Exam
          </Button>
        }
      />

      <div className={styles.topTabs}>
        <button
          className={`${styles.tabBtn} ${view === 'list' ? styles.tabBtnActive : ''}`}
          onClick={() => setView('list')}
        >
          Examinations List
        </button>
        <button
          className={`${styles.tabBtn} ${view === 'entry' ? styles.tabBtnActive : ''}`}
          onClick={() => setView('entry')}
          disabled={!activeExamId}
        >
          Marks Entry Grid
        </button>
        <button
          className={`${styles.tabBtn} ${view === 'results' ? styles.tabBtnActive : ''}`}
          onClick={() => setView('results')}
          disabled={!activeExamId}
        >
          Results & Rankings
        </button>
      </div>

      {/* View 1: Exams List */}
      {view === 'list' && (
        <DataTable<ExamItem>
          columns={examColumns}
          rows={exams}
          keyExtractor={(e) => e.id}
          loading={examsLoading}
          emptyText="No exams created for the current academic year."
        />
      )}

      {/* View 2: Marks Entry Grid */}
      {view === 'entry' && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.controlItem}>
              <label htmlFor="exam-select">Exam:</label>
              <select
                id="exam-select"
                className={styles.selectInput}
                value={activeExamId || ''}
                onChange={(e) => setActiveExamId(Number(e.target.value))}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlItem}>
              <label htmlFor="sec-select">Section:</label>
              <select
                id="sec-select"
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

            <div className={styles.controlItem}>
              <label htmlFor="sub-select">Subject:</label>
              <select
                id="sub-select"
                className={styles.selectInput}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {gridSubject && (
              <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                Full Marks: <strong>{gridSubject.full_marks}</strong> • Pass Marks:{' '}
                <strong>{gridSubject.pass_marks}</strong>
              </div>
            )}
          </div>

          {gridMessage && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                background: gridMessage.type === 'success' ? '#e6f4ea' : '#fce8e6',
                color: gridMessage.type === 'success' ? '#137333' : '#c5221f',
              }}
            >
              {gridMessage.text}
            </div>
          )}

          {gridLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading marks entry grid...</div>
          ) : gridStudents.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No active students enrolled in this section or subject not assigned.
            </div>
          ) : (
            <div>
              <table className={styles.gridTable}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Roll</th>
                    <th style={{ width: '140px' }}>Admission No</th>
                    <th>Student Name</th>
                    <th style={{ width: '180px' }}>Marks Obtained (Leave blank if absent)</th>
                  </tr>
                </thead>
                <tbody>
                  {gridStudents.map((st, idx) => {
                    const val = marksState[st.enrollment_id] ?? '';
                    const num = Number(val);
                    const isInvalid = val !== '' && (isNaN(num) || num < 0 || (gridSubject && num > gridSubject.full_marks));

                    return (
                      <tr key={st.enrollment_id}>
                        <td>{st.roll_no ?? '—'}</td>
                        <td>
                          <code>{st.admission_no}</code>
                        </td>
                        <td>
                          <strong>{st.full_name}</strong>
                        </td>
                        <td>
                          <input
                            ref={(el) => {
                              inputRefs.current[idx] = el;
                            }}
                            type="number"
                            min="0"
                            max={gridSubject?.full_marks ?? 100}
                            className={`${styles.markInput} ${isInvalid ? styles.markInputError : ''}`}
                            placeholder="Absent"
                            value={val}
                            onChange={(e) =>
                              setMarksState({
                                ...marksState,
                                [st.enrollment_id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextInput = inputRefs.current[idx + 1];
                                if (nextInput) nextInput.focus();
                              }
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <Button variant="primary" onClick={handleSaveMarks} disabled={gridSaving}>
                  {gridSaving ? 'Saving Marks...' : 'Save All Marks'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3: Results Ledger */}
      {view === 'results' && (
        <div>
          <div className={styles.controlBar}>
            <div className={styles.controlItem}>
              <label htmlFor="results-exam-select">Exam:</label>
              <select
                id="results-exam-select"
                className={styles.selectInput}
                value={activeExamId || ''}
                onChange={(e) => setActiveExamId(Number(e.target.value))}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlItem}>
              <label htmlFor="results-sec-select">Section:</label>
              <select
                id="results-sec-select"
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
          </div>

          <DataTable<ComputedResultRow>
            columns={ledgerColumns}
            rows={ledgerResults}
            keyExtractor={(r) => r.enrollment_id}
            loading={ledgerLoading}
            emptyText="No marks recorded for this section yet."
          />
        </div>
      )}

      {/* Create Exam Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Terminal Examination">
        <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Field
            label="Examination Name *"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="e.g. First Terminal Examination 2083"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field
              label="Start Date"
              type="date"
              value={createForm.start_date}
              onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
            />
            <Field
              label="End Date"
              type="date"
              value={createForm.end_date}
              onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Examination'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
