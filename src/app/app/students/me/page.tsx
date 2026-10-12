'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './StudentProfile.module.css';

interface StudentProfileData {
  student: {
    id: number;
    admission_no: string;
    full_name: string;
    gender: string | null;
    dob: string | null;
    blood_group: string | null;
    address: string | null;
    house_name: string | null;
    class_name: string | null;
    section_name: string | null;
    roll_no: number | null;
    status: string;
    admitted_on: string | null;
  };
  guardians: Array<{
    id: number;
    name: string;
    relation: string;
    phone: string;
    email: string | null;
  }>;
  transport: {
    route_name: string;
    vehicle_no: string | null;
    stop_name: string | null;
    pickup_time: string | null;
  } | null;
  attendanceStats: Array<{
    status: string;
    count: number;
  }>;
  recentResults: Array<{
    exam_id: number;
    exam_name: string;
    marks: number;
    subject_name: string;
    full_marks: number;
    pass_marks: number;
  }>;
  invoices: Array<{
    id: number;
    invoice_no: string;
    title: string;
    total: number;
    due_date: string;
    status: string;
  }>;
}

export default function StudentMyProfilePage() {
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/students/me')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading your student profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorState}>
        <Icon name="alert" size={32} />
        <h2>Unable to load profile</h2>
        <p>{error || 'Profile not found'}</p>
        <Link href="/app/dashboard">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { student, guardians, transport, attendanceStats, recentResults, invoices } = data;

  const totalDays = attendanceStats.reduce((sum, item) => sum + item.count, 0);
  const presentDays = attendanceStats.find((item) => item.status === 'present')?.count || 0;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className={styles.container}>
      <PageHeader
        title="My Student Profile"
        description="Official academic identity, enrollment credentials, and personal records at Balodaya Secondary School."
        actions={
          <div className={styles.headerActions}>
            <Link href="/app/timetable">
              <Button variant="secondary" size="sm">
                <Icon name="timetable" size={14} /> View Timetable
              </Button>
            </Link>
            <Link href="/app/exams">
              <Button variant="primary" size="sm">
                <Icon name="exams" size={14} /> My Exam Results
              </Button>
            </Link>
          </div>
        }
      />

      {/* Identity Card */}
      <div className={styles.idCard}>
        <div className={styles.idHeader}>
          <div className={styles.avatarCircle}>
            {student.full_name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.idMeta}>
            <div className={styles.nameRow}>
              <h2 className={styles.studentName}>{student.full_name}</h2>
              <Badge variant={student.status === 'active' ? 'success' : 'neutral'}>
                {student.status.toUpperCase()}
              </Badge>
            </div>
            <div className={styles.admNo}>Admission ID: <strong>{student.admission_no}</strong></div>
            <div className={styles.academicBadge}>
              {student.class_name ? `${student.class_name} • Section ${student.section_name || 'A'}` : 'Unassigned'}
              {student.roll_no ? ` • Roll No: ${student.roll_no}` : ''}
            </div>
          </div>
        </div>

        <div className={styles.quickGrid}>
          <div className={styles.quickItem}>
            <span className={styles.quickLabel}>House</span>
            <span className={styles.quickValue}>{student.house_name || 'No House Assigned'}</span>
          </div>
          <div className={styles.quickItem}>
            <span className={styles.quickLabel}>Attendance Rate</span>
            <span className={styles.quickValue}>{attendanceRate}%</span>
          </div>
          <div className={styles.quickItem}>
            <span className={styles.quickLabel}>Blood Group</span>
            <span className={styles.quickValue}>{student.blood_group || '—'}</span>
          </div>
          <div className={styles.quickItem}>
            <span className={styles.quickLabel}>Enrolled Date</span>
            <span className={styles.quickValue}>{student.admitted_on || 'Current Session'}</span>
          </div>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        {/* Guardians Card */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <Icon name="staff" size={18} />
            <h3>Guardians & Emergency Contacts</h3>
          </div>
          <div className={styles.panelBody}>
            {guardians.length === 0 ? (
              <p className={styles.emptyText}>No guardian details on record.</p>
            ) : (
              <div className={styles.guardianList}>
                {guardians.map((g) => (
                  <div key={g.id} className={styles.guardianItem}>
                    <div>
                      <div className={styles.guardianName}>{g.name}</div>
                      <div className={styles.guardianRelation}>{g.relation}</div>
                    </div>
                    <div className={styles.guardianContact}>
                      <div>{g.phone}</div>
                      {g.email && <small>{g.email}</small>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transport Card */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <Icon name="transport" size={18} />
            <h3>School Bus & Route Information</h3>
          </div>
          <div className={styles.panelBody}>
            {transport ? (
              <div className={styles.transportDetails}>
                <div className={styles.detailRow}>
                  <span>Assigned Route</span>
                  <strong>{transport.route_name}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Vehicle Number</span>
                  <strong>{transport.vehicle_no || 'School Bus'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Designated Stop</span>
                  <strong>{transport.stop_name || 'Main Gate'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Pickup Time</span>
                  <strong>{transport.pickup_time || '07:30 AM'}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.emptyText}>Not enrolled in school transportation service.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity summary */}
      <div className={styles.sectionGrid}>
        {/* Recent Results */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <Icon name="exams" size={18} />
            <h3>Published Exam Results</h3>
          </div>
          <div className={styles.panelBody}>
            {recentResults.length === 0 ? (
              <p className={styles.emptyText}>No published results available yet.</p>
            ) : (
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td>{r.subject_name}</td>
                      <td>{r.exam_name}</td>
                      <td><strong>{r.marks}</strong></td>
                      <td>{r.full_marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <Icon name="fees" size={18} />
            <h3>Fee Invoices</h3>
          </div>
          <div className={styles.panelBody}>
            {invoices.length === 0 ? (
              <p className={styles.emptyText}>No invoices issued.</p>
            ) : (
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.invoice_no}</td>
                      <td>{inv.title}</td>
                      <td>NPR {inv.total.toLocaleString()}</td>
                      <td>
                        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
