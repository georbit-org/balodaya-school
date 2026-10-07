'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';

interface ApplicationItem {
  id: number;
  reference: string;
  student_name: string;
  dob: string | null;
  gender: string | null;
  class_applying: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  address: string | null;
  previous_school: string | null;
  notes: string | null;
  status: 'new' | 'reviewing' | 'accepted' | 'rejected' | 'enrolled';
  student_id: number | null;
  created_at: string;
}

interface SectionOption {
  id: number;
  className: string;
  sectionName: string;
}

export default function ApplicationsManagementPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected Detail Modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Enroll Modal
  const [enrollModalApp, setEnrollModalApp] = useState<ApplicationItem | null>(null);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('q', search);

      const res = await fetch(`/api/applications?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setApplications(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const loadSections = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const d = await res.json();
        const opts: SectionOption[] = [];
        for (const cls of d.classes || []) {
          for (const sec of cls.sections || []) {
            opts.push({
              id: sec.id,
              className: cls.name,
              sectionName: sec.name,
            });
          }
        }
        setSections(opts);
        if (opts.length > 0 && !selectedSectionId) {
          setSelectedSectionId(String(opts[0].id));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadApps();
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, status: newStatus as ApplicationItem['status'] } : null));
        }
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update status.');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalApp || !selectedSectionId) return;

    setEnrolling(true);
    try {
      const res = await fetch(`/api/applications/${enrollModalApp.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: parseInt(selectedSectionId, 10) }),
      });

      const d = await res.json();
      if (res.ok) {
        alert(`Success! Student enrolled: ${d.admissionNo} (Roll No: ${d.rollNo})`);
        setEnrollModalApp(null);
        setSelectedApp(null);
        loadApps();
      } else {
        alert(d.error || 'Failed to enroll student.');
      }
    } catch {
      alert('Network error enrolling student.');
    } finally {
      setEnrolling(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      header: 'Reference & Date',
      render: (a: ApplicationItem) => (
        <div>
          <strong style={{ color: 'var(--ink)' }}>{a.reference}</strong>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
            {a.created_at.slice(0, 10)}
          </div>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student & Applying Class',
      render: (a: ApplicationItem) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.student_name}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>
            Applying for: {a.class_applying}
          </div>
        </div>
      ),
    },
    {
      key: 'guardian',
      header: 'Guardian Contact',
      render: (a: ApplicationItem) => (
        <div>
          <div>{a.guardian_name}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>{a.guardian_phone}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: ApplicationItem) => {
        const colorMap: Record<string, string> = {
          new: 'var(--accent)',
          reviewing: 'var(--warning)',
          accepted: 'var(--success)',
          rejected: 'var(--danger)',
          enrolled: 'var(--success)',
        };
        return (
          <span style={{ color: colorMap[a.status] || 'var(--ink)', fontWeight: 600, textTransform: 'capitalize' }}>
            {a.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: ApplicationItem) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button size="sm" variant="secondary" onClick={() => setSelectedApp(a)}>
            View Details
          </Button>
          {a.status !== 'enrolled' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEnrollModalApp(a);
                loadSections();
              }}
            >
              Enroll
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admissions Applications"
        description="Review online admission inquiries, manage applicant review stages, and enroll approved candidates."
      />

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBlock: 'var(--sp-4)', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search by student name, ref, or guardian phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            fontSize: 'var(--text-sm)',
            width: 320,
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <option value="">All Statuses</option>
          <option value="new">New Inquiries</option>
          <option value="reviewing">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="enrolled">Enrolled Students</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} rows={applications} loading={loading} emptyText="No admissions applications found." />

      {/* Detail Dialog */}
      {selectedApp && (
        <Dialog
          open={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Application Details (${selectedApp.reference})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Student Name</span>
                <div style={{ fontWeight: 600 }}>{selectedApp.student_name}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Class Applying</span>
                <div style={{ fontWeight: 600 }}>{selectedApp.class_applying}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Date of Birth</span>
                <div>{selectedApp.dob || 'Not provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Gender</span>
                <div style={{ textTransform: 'capitalize' }}>{selectedApp.gender || 'Not specified'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Guardian Name</span>
                <div>{selectedApp.guardian_name}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Guardian Phone</span>
                <div>{selectedApp.guardian_phone}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Guardian Email</span>
                <div>{selectedApp.guardian_email || 'None'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Previous School</span>
                <div>{selectedApp.previous_school || 'None'}</div>
              </div>
            </div>

            {selectedApp.address && (
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Address</span>
                <div>{selectedApp.address}</div>
              </div>
            )}

            {selectedApp.notes && (
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>Applicant Notes</span>
                <div style={{ fontStyle: 'italic', color: 'var(--ink-soft)' }}>{selectedApp.notes}</div>
              </div>
            )}

            {/* Status change actions */}
            {selectedApp.status !== 'enrolled' && (
              <div style={{ marginTop: 'var(--sp-3)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--line)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)', alignSelf: 'center' }}>
                  Update Status:
                </span>
                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedApp.id, 'reviewing')}>
                  Mark Reviewing
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedApp.id, 'accepted')}>
                  Mark Accepted
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}>
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setEnrollModalApp(selectedApp);
                    loadSections();
                  }}
                >
                  Enroll Student
                </Button>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Enroll Dialog */}
      {enrollModalApp && (
        <Dialog
          open={Boolean(enrollModalApp)}
          onClose={() => setEnrollModalApp(null)}
          title={`Enroll ${enrollModalApp.student_name}`}
        >
          <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              Assigning {enrollModalApp.student_name} to a class section will generate their formal admission number and enrollment roll number.
            </p>

            <Field
              label="Select Section"
              as="select"
              required
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              options={sections.map((s) => ({
                label: `${s.className} - Section ${s.sectionName}`,
                value: String(s.id),
              }))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <Button variant="secondary" type="button" onClick={() => setEnrollModalApp(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={enrolling}>
                Confirm &amp; Enroll
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
