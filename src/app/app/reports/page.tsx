'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import styles from './Reports.module.css';

interface SectionOption {
  id: number;
  label: string;
}

interface ExamOption {
  id: number;
  name: string;
}

export default function ReportsExportPage() {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);

  // Filters for attendance
  const [attSectionId, setAttSectionId] = useState('');
  const [attMonth, setAttMonth] = useState(new Date().toISOString().slice(0, 7));

  // Filters for results
  const [resExamId, setResExamId] = useState('');
  const [resSectionId, setResSectionId] = useState('');

  // Filters for payments
  const [payFrom, setPayFrom] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [payTo, setPayTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const list: SectionOption[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            list.push({ id: sec.id, label: `${cls.name} (${sec.name})` });
          }
        }
        setSections(list);
        if (list.length > 0) {
          setAttSectionId(String(list[0].id));
          setResSectionId(String(list[0].id));
        }
      })
      .catch(() => {});

    fetch('/api/exams')
      .then((r) => r.json())
      .then((d) => {
        const list: ExamOption[] = d.exams || [];
        setExams(list);
        if (list.length > 0) setResExamId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Reports & Data Exports"
        description="Download spreadsheet exports formatted with UTF-8 BOM encoding for direct opening in Microsoft Excel and Google Sheets."
      />

      <div className={styles.reportGrid}>
        {/* 1. Students Directory */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Students Directory Master Roster</h2>
            <p>Complete student roster with admission numbers, parent contacts, section rolls, and house allocations.</p>
          </div>
          <div className={styles.cardActions}>
            <a href="/api/reports/students" download style={{ textDecoration: 'none' }}>
              <Button variant="primary">Download CSV &darr;</Button>
            </a>
          </div>
        </div>

        {/* 2. Monthly Attendance */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Monthly Attendance Summary</h2>
            <p>Tallies of present, absent, late, and approved leaves with attendance percentage per student.</p>
          </div>
          <div className={styles.filterControls}>
            <div className={styles.formGrid}>
              <Field label="Target Section">
                <select value={attSectionId} onChange={(e) => setAttSectionId(e.target.value)}>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Month (YYYY-MM)">
                <input type="month" value={attMonth} onChange={(e) => setAttMonth(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className={styles.cardActions}>
            <a
              href={`/api/reports/attendance-month?section_id=${attSectionId}&month=${attMonth}`}
              download
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary" disabled={!attSectionId}>Download CSV &darr;</Button>
            </a>
          </div>
        </div>

        {/* 3. Examination Results */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Exam Results &amp; Marks Ledger</h2>
            <p>Subject marks totals, percentage, grade, GPA, and dense class rank for terminal examinations.</p>
          </div>
          <div className={styles.filterControls}>
            <div className={styles.formGrid}>
              <Field label="Examination">
                <select value={resExamId} onChange={(e) => setResExamId(e.target.value)}>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Section">
                <select value={resSectionId} onChange={(e) => setResSectionId(e.target.value)}>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div className={styles.cardActions}>
            <a
              href={`/api/reports/results?exam_id=${resExamId}&section_id=${resSectionId}`}
              download
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary" disabled={!resExamId || !resSectionId}>Download CSV &darr;</Button>
            </a>
          </div>
        </div>

        {/* 4. Fee Receivables & Dues */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Outstanding Fee Dues Report</h2>
            <p>List of all students with uncollected tuition and transport balances, total invoiced, and emergency phone.</p>
          </div>
          <div className={styles.cardActions}>
            <a href="/api/reports/dues" download style={{ textDecoration: 'none' }}>
              <Button variant="primary">Download CSV &darr;</Button>
            </a>
          </div>
        </div>

        {/* 5. Payments Ledger */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Cashier Payment Collections Ledger</h2>
            <p>Chronological receipt journal including payment method, transaction references, and cashier initials.</p>
          </div>
          <div className={styles.filterControls}>
            <div className={styles.formGrid}>
              <Field label="From Date">
                <input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
              </Field>
              <Field label="To Date">
                <input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className={styles.cardActions}>
            <a
              href={`/api/reports/payments?from=${payFrom}&to=${payTo}`}
              download
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary">Download CSV &darr;</Button>
            </a>
          </div>
        </div>

        {/* 6. Library Overdue */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Library Overdue Circulation Report</h2>
            <p>List of unreturned library books that have passed the standard 14-day borrowing loan period.</p>
          </div>
          <div className={styles.cardActions}>
            <a href="/api/reports/library-overdue" download style={{ textDecoration: 'none' }}>
              <Button variant="primary">Download CSV &darr;</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
