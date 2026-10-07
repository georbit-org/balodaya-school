'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from './Marksheet.module.css';

interface SubjectMarkDetail {
  subject_id: number;
  subject_name: string;
  full_marks: number;
  pass_marks: number;
  obtained: number | null;
  percentage: number;
  grade: string;
  gpa: number;
  passed: boolean;
}

interface StudentResultData {
  student_id: number;
  admission_no: string;
  student_name: string;
  roll_no: number | null;
  total_obtained: number;
  total_full_marks: number;
  percentage: number;
  result: 'Pass' | 'Fail';
  gpa: number;
  rank: number | null;
  subjects: SubjectMarkDetail[];
}

interface ExamInfo {
  name: string;
  academic_year_name: string;
}

interface SectionInfo {
  name: string;
  class_name: string;
}

export default function MarksheetPrintPage() {
  const params = useParams();
  const slug = params?.slug as string; // e.g. "1-1"

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [result, setResult] = useState<StudentResultData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    const parts = slug.split('-');
    if (parts.length < 2) {
      setError('Invalid marksheet identifier.');
      setLoading(false);
      return;
    }

    const examId = parts[0];
    const studentId = parts[1];

    fetch(`/api/exams/${examId}/results?student_id=${studentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load marksheet.');
        }
        return res.json();
      })
      .then((d) => {
        setExam(d.exam);
        setSection(d.section);
        setResult(d.result);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Generating official marksheet...</div>;
  }

  if (error || !result || !exam || !section) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#c5221f' }}>
        <h3>Unable to load marksheet</h3>
        <p>{error || 'Record not found or not published.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.noPrintBar}>
        <span style={{ fontSize: '14px', color: '#666' }}>Official Student Progress Report</span>
        <Button variant="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className={styles.schoolHeader}>
        <div className={styles.schoolName}>Balodaya Secondary English Boarding School</div>
        <div className={styles.schoolAddress}>
          Bheerkot-5, Bayarghari, Syangja, Gandaki Province, Nepal • Estd. 2063 B.S.
        </div>
        <div className={styles.docTitle}>Terminal Examination Grade Sheet</div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Student Name:</span>
          <span className={styles.metaValue}>{result.student_name}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Academic Year:</span>
          <span className={styles.metaValue}>{exam.academic_year_name} B.S.</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Admission No:</span>
          <span className={styles.metaValue}>{result.admission_no}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Examination:</span>
          <span className={styles.metaValue}>{exam.name}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Class & Section:</span>
          <span className={styles.metaValue}>
            {section.class_name} ({section.name})
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Roll Number:</span>
          <span className={styles.metaValue}>{result.roll_no ?? '—'}</span>
        </div>
      </div>

      <table className={styles.marksTable}>
        <thead>
          <tr>
            <th style={{ width: '40px' }} className={styles.center}>SN</th>
            <th>Subject Title</th>
            <th style={{ width: '80px' }} className={styles.center}>Full Marks</th>
            <th style={{ width: '80px' }} className={styles.center}>Pass Marks</th>
            <th style={{ width: '80px' }} className={styles.center}>Obtained</th>
            <th style={{ width: '60px' }} className={styles.center}>Grade</th>
            <th style={{ width: '60px' }} className={styles.center}>GPA</th>
          </tr>
        </thead>
        <tbody>
          {result.subjects.map((sub, idx) => (
            <tr key={sub.subject_id}>
              <td className={styles.center}>{idx + 1}</td>
              <td className={styles.bold}>{sub.subject_name}</td>
              <td className={styles.center}>{sub.full_marks}</td>
              <td className={styles.center}>{sub.pass_marks}</td>
              <td className={styles.center}>
                {sub.obtained !== null ? sub.obtained : 'Abs'}
              </td>
              <td className={styles.center}>{sub.grade}</td>
              <td className={styles.center}>{sub.gpa.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.summaryBox}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Total Marks</div>
          <div className={styles.summaryValue}>
            {result.total_obtained} / {result.total_full_marks}
          </div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Percentage</div>
          <div className={styles.summaryValue}>{result.percentage}%</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Grade Point Average</div>
          <div className={styles.summaryValue}>{result.gpa.toFixed(2)}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Final Result / Rank</div>
          <div
            className={styles.summaryValue}
            style={{ color: result.result === 'Pass' ? '#137333' : '#c5221f' }}
          >
            {result.result} {result.rank !== null ? `(#${result.rank})` : ''}
          </div>
        </div>
      </div>

      <div className={styles.signatureRow}>
        <div className={styles.sigBlock}>
          <div className={styles.sigLine}>Class Teacher</div>
        </div>
        <div className={styles.sigBlock}>
          <div className={styles.sigLine}>Examination Incharge</div>
        </div>
        <div className={styles.sigBlock}>
          <div className={styles.sigLine}>Principal</div>
        </div>
      </div>
    </div>
  );
}
