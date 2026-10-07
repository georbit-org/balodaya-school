'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from './TC.module.css';

interface Guardian {
  id: number;
  name: string;
  relation: string;
  phone: string;
  is_primary: number;
}

interface Enrollment {
  id: number;
  roll_no: number | null;
  academic_year: string;
  class_name: string;
  section_name: string;
}

interface StudentDetail {
  id: number;
  admission_no: string;
  full_name: string;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  address: string | null;
  status: string;
  admitted_on: string | null;
  created_at: string;
}

export default function TransferCertificatePrintPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;

    fetch(`/api/students/${studentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load student record.');
        }
        return res.json();
      })
      .then((data) => {
        setStudent(data.student);
        setGuardians(data.guardians || []);
        setEnrollments(data.enrollments || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Transfer Certificate...</div>;
  }

  if (error || !student) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#c5221f' }}>
        <h3>Unable to generate certificate</h3>
        <p>{error || 'Student not found.'}</p>
        <Button variant="secondary" onClick={() => window.history.back()} style={{ marginTop: '16px' }}>
          Back to Students
        </Button>
      </div>
    );
  }

  const primaryGuardian = guardians.find((g) => g.is_primary) || guardians[0];
  const father = guardians.find((g) => g.relation?.toLowerCase() === 'father') || primaryGuardian;
  const mother = guardians.find((g) => g.relation?.toLowerCase() === 'mother');
  const latestEnrollment = enrollments[0];
  const certNumber = `TC-2083-${String(student.id).padStart(4, '0')}`;
  const issueDate = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      {/* Top Non-Print Action Bar */}
      <div className={styles.noPrintBar}>
        <Button variant="secondary" onClick={() => window.history.back()}>
          &larr; Back
        </Button>
        <div className={styles.printBtnGroup}>
          <Button variant="primary" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Box */}
      <div className={styles.certificateBorder}>
        <header className={styles.header}>
          <h1 className={styles.schoolName}>Balodaya Secondary English Boarding School</h1>
          <p className={styles.address}>Bheerkot-06, Bayarghari, Syangja, Gandaki Province, Nepal</p>
          <p className={styles.motto}>&ldquo;The Need of Education, Civilization of the Nation&rdquo; &bull; Estd. 2063 B.S.</p>
          <div>
            <span className={styles.certTitleBadge}>Transfer Certificate / School Leaving Certificate</span>
          </div>
        </header>

        <div className={styles.topMeta}>
          <span><strong>Certificate No:</strong> {certNumber}</span>
          <span><strong>Date of Issue:</strong> {issueDate}</span>
        </div>

        <table className={styles.table}>
          <tbody>
            <tr>
              <td className={styles.colSno}>1.</td>
              <td className={styles.colLabel}>Name of the Student:</td>
              <td className={styles.colVal}><strong>{student.full_name}</strong></td>
            </tr>
            <tr>
              <td className={styles.colSno}>2.</td>
              <td className={styles.colLabel}>Admission / Registration No:</td>
              <td className={styles.colVal}><strong>{student.admission_no}</strong></td>
            </tr>
            <tr>
              <td className={styles.colSno}>3.</td>
              <td className={styles.colLabel}>Father&apos;s / Primary Guardian&apos;s Name:</td>
              <td className={styles.colVal}>{father ? `${father.name} (${father.relation})` : '—'}</td>
            </tr>
            <tr>
              <td className={styles.colSno}>4.</td>
              <td className={styles.colLabel}>Mother&apos;s Name:</td>
              <td className={styles.colVal}>{mother ? mother.name : '—'}</td>
            </tr>
            <tr>
              <td className={styles.colSno}>5.</td>
              <td className={styles.colLabel}>Nationality:</td>
              <td className={styles.colVal}>Nepali</td>
            </tr>
            <tr>
              <td className={styles.colSno}>6.</td>
              <td className={styles.colLabel}>Date of Birth:</td>
              <td className={styles.colVal}>{student.dob || 'Recorded in school register'}</td>
            </tr>
            <tr>
              <td className={styles.colSno}>7.</td>
              <td className={styles.colLabel}>Permanent / Current Address:</td>
              <td className={styles.colVal}>{student.address || 'Bheerkot-06, Syangja'}</td>
            </tr>
            <tr>
              <td className={styles.colSno}>8.</td>
              <td className={styles.colLabel}>Date of First Admission in School:</td>
              <td className={styles.colVal}>{student.admitted_on || '—'}</td>
            </tr>
            <tr>
              <td className={styles.colSno}>9.</td>
              <td className={styles.colLabel}>Class in which pupil last studied:</td>
              <td className={styles.colVal}>
                <strong>{latestEnrollment ? `${latestEnrollment.class_name} (${latestEnrollment.section_name})` : 'Class 9'}</strong>
              </td>
            </tr>
            <tr>
              <td className={styles.colSno}>10.</td>
              <td className={styles.colLabel}>School / Annual Examination last taken:</td>
              <td className={styles.colVal}>Annual Examination &bull; <strong>Passed &amp; Qualified</strong></td>
            </tr>
            <tr>
              <td className={styles.colSno}>11.</td>
              <td className={styles.colLabel}>Whether failed, if so once / twice:</td>
              <td className={styles.colVal}>No</td>
            </tr>
            <tr>
              <td className={styles.colSno}>12.</td>
              <td className={styles.colLabel}>Subjects Studied:</td>
              <td className={styles.colVal}>English, Nepali, Compulsory Mathematics, Science, Social Studies, Health &amp; Physical Education</td>
            </tr>
            <tr>
              <td className={styles.colSno}>13.</td>
              <td className={styles.colLabel}>Whether school dues cleared:</td>
              <td className={styles.colVal}>Yes, all school dues have been settled in full</td>
            </tr>
            <tr>
              <td className={styles.colSno}>14.</td>
              <td className={styles.colLabel}>General Conduct &amp; Character:</td>
              <td className={styles.colVal}><strong>Good / Exemplary</strong></td>
            </tr>
            <tr>
              <td className={styles.colSno}>15.</td>
              <td className={styles.colLabel}>Reason for Leaving School:</td>
              <td className={styles.colVal}>Transfer / Completed course of study</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.signatures}>
          <div className={styles.sigBox}>
            <div className={styles.sigLine} />
            <span className={styles.sigTitle}>Prepared By (Accountant)</span>
          </div>

          <div className={styles.sealBox}>
            <span>Official<br />School Seal</span>
          </div>

          <div className={styles.sigBox}>
            <div className={styles.sigLine} />
            <span className={styles.sigTitle}>Checked By (Exam In-charge)</span>
          </div>

          <div className={styles.sigBox}>
            <div className={styles.sigLine} />
            <span className={styles.sigTitle}>Principal / Headmaster</span>
          </div>
        </div>
      </div>
    </div>
  );
}
