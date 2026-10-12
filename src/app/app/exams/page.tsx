'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useSession, Can } from '@/components/auth/SessionProvider';
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
  is_absent?: number | null;
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
  const { user, can } = useSession();
  const canEnterMarks = can('marks.enter');
  const canPublish = can('marks.publish');
  const canManageExams = can('exam.manage');
  const isStudentOrParent = user.role === 'student' || user.role === 'parent';

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
  const [singleStudentResult, setSingleStudentResult] = useState<ComputedResultRow | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Load exams
  const loadExams = useCallback(async () => {
    setExamsLoading(true);
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const d = await res.json();
        let items: ExamItem[] = d.items || [];
        // Students and parents only see published exams
        if (isStudentOrParent) {
          items = items.filter((e) => e.published === 1);
        }
        setExams(items);
        if (items.length > 0 && !activeExamId) {
          setActiveExamId(items[0].id);
        }
      }
    } finally {
      setExamsLoading(false);
    }
  }, [isStudentOrParent, activeExamId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Load sections (classes metadata)
  useEffect(() => {
    if (isStudentOrParent) return;

    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const opts: { id: number; classId: number; label: string }[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({
              id: sec.id,
              classId: cls.id,
              label: `${cls.name} - Sec ${sec.name}`,
            });
          }
        }
        setSections(opts);
        if (opts.length > 0 && !selectedSectionId) {
          setSelectedSectionId(String(opts[0].id));
        }
      })
      .catch(() => {});
  }, [isStudentOrParent, selectedSectionId]);

  // Load subjects when section changes
  useEffect(() => {
    if (isStudentOrParent || !selectedSectionId) return;

    const sec = sections.find((s) => String(s.id) === selectedSectionId);
    if (!sec) return;

    fetch(`/api/classes/${sec.classId}/subjects`)
      .then((r) => r.json())
      .then((d) => {
        const subs = (d.subjects || []).map((s: { subject_id: number; subject_name: string }) => ({
          id: s.subject_id,
          name: s.subject_name,
        }));
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(String(subs[0].id));
        } else {
          setSelectedSubjectId('');
        }
      })
      .catch(() => {});
  }, [selectedSectionId, sections, isStudentOrParent]);

  // Load marks grid (Teachers / Admin only)
  const loadMarksGrid = useCallback(async () => {
    if (!activeExamId || !selectedSectionId || !selectedSubjectId || isStudentOrParent) return;
    setGridLoading(true);
    setGridMessage(null);

    try {
      const res = await fetch(
        `/api/exams/${activeExamId}/marks?section_id=${selectedSectionId}&subject_id=${selectedSubjectId}`
      );
      if (res.ok) {
        const d = await res.json();
        setGridSubject({
          full_marks: d.subject.full_marks,
          pass_marks: d.subject.pass_marks,
        });
        setGridStudents(d.students || []);

        const initial: Record<number, string> = {};
        for (const st of d.students || []) {
          if (st.is_absent) {
            initial[st.enrollment_id] = 'AB';
          } else {
            initial[st.enrollment_id] = st.marks !== null && st.marks !== undefined ? String(st.marks) : '';
          }
        }
        setMarksState(initial);
      }
    } finally {
      setGridLoading(false);
    }
  }, [activeExamId, selectedSectionId, selectedSubjectId, isStudentOrParent]);

  useEffect(() => {
    if (view === 'entry') {
      loadMarksGrid();
    }
  }, [view, loadMarksGrid]);

  // Load results ledger
  const loadResults = useCallback(async () => {
    if (!activeExamId) return;
    setLedgerLoading(true);
    setSingleStudentResult(null);

    try {
      const url = isStudentOrParent
        ? `/api/exams/${activeExamId}/results`
        : `/api/exams/${activeExamId}/results?section_id=${selectedSectionId}`;

      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        if (isStudentOrParent) {
          setSingleStudentResult(d.result || null);
          setLedgerResults(d.results || []);
        } else {
          setLedgerResults(d.results || []);
        }
      }
    } finally {
      setLedgerLoading(false);
    }
  }, [activeExamId, selectedSectionId, isStudentOrParent]);

  useEffect(() => {
    if (view === 'results') {
      loadResults();
    }
  }, [view, loadResults]);

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

  const handleTogglePublish = async (examItem: ExamItem) => {
    try {
      const res = await fetch(`/api/exams/${examItem.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unpublish: Boolean(examItem.published) }),
      });
      if (res.ok) {
        loadExams();
      }
    } catch {
      alert('Failed to update publication status.');
    }
  };

  const handleSaveMarks = async () => {
    if (!activeExamId || !selectedSectionId || !selectedSubjectId || !gridSubject) return;
    setGridSaving(true);
    setGridMessage(null);

    for (const st of gridStudents) {
      const val = marksState[st.enrollment_id];
      if (val !== '' && val !== undefined && val !== 'AB' && val !== 'ab') {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > gridSubject.full_marks) {
          setGridMessage({
            type: 'error',
            text: `Invalid mark for ${st.full_name}: must be between 0 and ${gridSubject.full_marks} (or AB for absent).`,
          });
          setGridSaving(false);
          return;
        }
      }
    }

    const payload = {
      section_id: parseInt(selectedSectionId, 10),
      subject_id: parseInt(selectedSubjectId, 10),
      marks: gridStudents.map((st) => {
        const val = marksState[st.enrollment_id];
        const isAbsent = val === 'AB' || val === 'ab';
        return {
          enrollment_id: st.enrollment_id,
          marks: isAbsent || val === '' ? null : Number(val),
          is_absent: isAbsent ? 1 : 0,
        };
      }),
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
        e.start_date ? `${e.start_date} ${e.end_date ? `to ${e.end_date}` : ''}` : 'Conducted',
    },
    {
      key: 'status',
      header: 'Publication Status',
      render: (e: ExamItem) =>
        e.published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="neutral">Draft (Internal)</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: ExamItem) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {canEnterMarks && (
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
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActiveExamId(e.id);
              setView('results');
            }}
          >
            {isStudentOrParent ? 'View Marksheet' : 'Ledger & Rankings'}
          </Button>
          {canPublish && (
            <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(e)}>
              {e.published ? 'Unpublish' : 'Publish'}
            </Button>
          )}
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
        r.result === 'Pass' ? <Badge variant="success">Pass</Badge> : <Badge variant="danger">Fail</Badge>,
    },
    {
      key: 'print',
      header: 'Official Marksheet',
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
        title={isStudentOrParent ? 'Academic Examination Results' : 'Examinations & Marks Ledger'}
        description={
          isStudentOrParent
            ? 'Official published term examination marksheets, GPA scores, and grade evaluations.'
            : 'Term examination schedules, subject marks entry, GPA calculations, and official marksheets.'
        }
        actions={
          canManageExams ? (
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              + Create New Exam
            </Button>
          ) : undefined
        }
      />

      <div className={styles.topTabs}>
        <button
          className={`${styles.tabBtn} ${view === 'list' ? styles.tabBtnActive : ''}`}
          onClick={() => setView('list')}
        >
          {isStudentOrParent ? 'Published Exams' : 'Examinations List'}
        </button>

        {canEnterMarks && (
          <button
            className={`${styles.tabBtn} ${view === 'entry' ? styles.tabBtnActive : ''}`}
            onClick={() => setView('entry')}
            disabled={!activeExamId}
          >
            Marks Entry Grid
          </button>
        )}

        <button
          className={`${styles.tabBtn} ${view === 'results' ? styles.tabBtnActive : ''}`}
          onClick={() => setView('results')}
          disabled={!activeExamId}
        >
          {isStudentOrParent ? 'Report Card' : 'Results & Rankings'}
        </button>
      </div>

      {/* View 1: Exams List */}
      {view === 'list' && (
        <DataTable<ExamItem>
          columns={examColumns}
          rows={exams}
          keyExtractor={(e) => e.id}
          loading={examsLoading}
          emptyText={
            isStudentOrParent
              ? 'No published examination results yet for this session.'
              : 'No exams created for the current academic year.'
          }
        />
      )}

      {/* View 2: Marks Entry Grid (Teachers & Staff) */}
      {view === 'entry' && canEnterMarks && (
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
              <div className={styles.rulePill}>
                Full: <strong>{gridSubject.full_marks}</strong> | Pass:{' '}
                <strong>{gridSubject.pass_marks}</strong> (type &apos;AB&apos; for absent)
              </div>
            )}
          </div>

          {gridMessage && (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                background: gridMessage.type === 'success' ? 'var(--success-subtle, #ecfdf5)' : 'var(--danger-subtle, #fef2f2)',
                color: gridMessage.type === 'success' ? 'var(--success, #059669)' : 'var(--danger, #dc2626)',
                fontWeight: 500,
              }}
            >
              {gridMessage.text}
            </div>
          )}

          {gridLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
              Loading marks grid...
            </div>
          ) : (
            <div>
              <table className={styles.gridTable}>
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Adm No</th>
                    <th>Student Name</th>
                    <th>Score / Marks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gridStudents.map((st, idx) => {
                    const currentVal = marksState[st.enrollment_id] || '';
                    const isAbsent = currentVal === 'AB' || currentVal === 'ab';
                    const numVal = Number(currentVal);
                    const isPassed = !isAbsent && currentVal !== '' && gridSubject && numVal >= gridSubject.pass_marks;
                    const isFailed = !isAbsent && currentVal !== '' && gridSubject && numVal < gridSubject.pass_marks;

                    return (
                      <tr key={st.enrollment_id}>
                        <td>{st.roll_no ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{st.admission_no}</td>
                        <td>{st.full_name}</td>
                        <td>
                          <input
                            ref={(el) => {
                              inputRefs.current[st.enrollment_id] = el;
                            }}
                            type="text"
                            className={styles.markInput}
                            value={currentVal}
                            placeholder="Score or AB"
                            onChange={(e) => {
                              setMarksState({
                                ...marksState,
                                [st.enrollment_id]: e.target.value.toUpperCase(),
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextStudent = gridStudents[idx + 1];
                                if (nextStudent) {
                                  inputRefs.current[nextStudent.enrollment_id]?.focus();
                                }
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevStudent = gridStudents[idx - 1];
                                if (prevStudent) {
                                  inputRefs.current[prevStudent.enrollment_id]?.focus();
                                }
                              }
                            }}
                          />
                        </td>
                        <td>
                          {isAbsent ? (
                            <Badge variant="neutral">Absent</Badge>
                          ) : isPassed ? (
                            <Badge variant="success">Pass</Badge>
                          ) : isFailed ? (
                            <Badge variant="danger">Fail</Badge>
                          ) : (
                            <span style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-xs)' }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <Button variant="primary" loading={gridSaving} onClick={handleSaveMarks}>
                  {gridSaving ? 'Saving...' : 'Save Section Marks'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3: Results Ledger (Staff View or Student/Parent Report Card) */}
      {view === 'results' && (
        <div>
          {isStudentOrParent ? (
            <div>
              {ledgerLoading ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  Loading report card...
                </div>
              ) : singleStudentResult ? (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-6)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', color: 'var(--ink)' }}>
                        {singleStudentResult.student_name}
                      </h2>
                      <div style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-sm)' }}>
                        Admission ID: {singleStudentResult.admission_no} • Roll: {singleStudentResult.roll_no || '—'}
                      </div>
                    </div>
                    <Link
                      href={`/app/print/marksheet/${activeExamId}-${singleStudentResult.student_id}`}
                      target="_blank"
                    >
                      <Button variant="primary">
                        <Icon name="print" size={16} /> Print Official Marksheet
                      </Button>
                    </Link>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', background: 'var(--surface-subtle, #f8fafc)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>GPA Score</span>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent, #0284c7)' }}>
                        {singleStudentResult.gpa.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Marks</span>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink)' }}>
                        {singleStudentResult.total_obtained} / {singleStudentResult.total_full_marks}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Percentage</span>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink)' }}>
                        {singleStudentResult.percentage}%
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Result</span>
                      <div style={{ marginTop: 4 }}>
                        {singleStudentResult.result === 'Pass' ? (
                          <Badge variant="success">PASS</Badge>
                        ) : (
                          <Badge variant="danger">FAIL</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <table className={styles.gridTable}>
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Marks Obtained</th>
                        <th>Letter Grade</th>
                        <th>Evaluation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {singleStudentResult.subjects.map((sub) => (
                        <tr key={sub.subject_id}>
                          <td><strong>{sub.subject_name}</strong></td>
                          <td>{sub.obtained !== null ? sub.obtained : 'Absent'}</td>
                          <td><strong>{sub.grade}</strong></td>
                          <td>
                            {sub.passed ? (
                              <Badge variant="success">Pass</Badge>
                            ) : (
                              <Badge variant="danger">Fail</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  No published marks available for this exam.
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.controlBar}>
                <div className={styles.controlItem}>
                  <label htmlFor="ledger-exam-select">Exam:</label>
                  <select
                    id="ledger-exam-select"
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
                  <label htmlFor="ledger-sec-select">Section:</label>
                  <select
                    id="ledger-sec-select"
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
                emptyText="No computed results found for this section."
              />
            </div>
          )}
        </div>
      )}

      {/* Create Exam Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Academic Examination"
      >
        <form onSubmit={handleCreateExam} className={styles.addForm}>
          <Field label="Exam Name" required>
            <input
              type="text"
              required
              placeholder="e.g. Second Terminal Examination 2083"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Field label="Start Date">
              <input
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
              />
            </Field>

            <Field label="End Date">
              <input
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
