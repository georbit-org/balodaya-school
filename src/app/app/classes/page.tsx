'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';

interface ClassData {
  id: number;
  name: string;
  sort_order: number;
  sections: Array<{ id: number; name: string; teacher_name: string | null }>;
  subjects: Array<{
    id: number;
    subject_id: number;
    subject_name: string;
    teacher_name: string | null;
    full_marks: number;
    pass_marks: number;
  }>;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface TeacherItem {
  id: number;
  name: string;
}

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Section Modal
  const [sectionModal, setSectionModal] = useState<{ open: boolean; classId: number | null; className: string }>({
    open: false,
    classId: null,
    className: '',
  });
  const [sectionName, setSectionName] = useState('A');
  const [sectionTeacherId, setSectionTeacherId] = useState('');

  // Assign Subject Modal
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; classId: number | null; className: string }>({
    open: false,
    classId: null,
    className: '',
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectTeacherId, setSubjectTeacherId] = useState('');
  const [fullMarks, setFullMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);

  // New Global Subject Modal
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, subRes, userRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/users?role=teacher'),
      ]);

      if (classRes.ok) {
        const d = await classRes.json();
        setClasses(d.classes || []);
      }
      if (subRes.ok) {
        const d = await subRes.json();
        setSubjects(d.subjects || []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setTeachers(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionModal.classId || !sectionName) return;

    try {
      const res = await fetch(`/api/classes/${sectionModal.classId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sectionName,
          class_teacher_id: sectionTeacherId ? parseInt(sectionTeacherId, 10) : null,
        }),
      });

      if (res.ok) {
        setSectionModal({ open: false, classId: null, className: '' });
        setSectionName('A');
        setSectionTeacherId('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add section.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal.classId || !selectedSubjectId) return;

    try {
      const res = await fetch(`/api/classes/${subjectModal.classId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubjectId, 10),
          teacher_id: subjectTeacherId ? parseInt(subjectTeacherId, 10) : null,
          full_marks: fullMarks,
          pass_marks: passMarks,
        }),
      });

      if (res.ok) {
        setSubjectModal({ open: false, classId: null, className: '' });
        setSelectedSubjectId('');
        setSubjectTeacherId('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to assign subject.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const handleCreateGlobalSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName }),
      });

      if (res.ok) {
        setCreateSubjectOpen(false);
        setNewSubjectName('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add subject.');
      }
    } catch {
      alert('Network error.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Classes, Sections &amp; Subjects"
        description="Configure academic classes, section divisions, assigned faculty, and subject pass-mark structures."
        actions={
          <Button variant="secondary" onClick={() => setCreateSubjectOpen(true)}>
            + Add New Subject
          </Button>
        }
      />

      {loading ? (
        <p style={{ marginTop: 'var(--sp-5)' }}>Loading academic hierarchy...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', marginTop: 'var(--sp-5)' }}>
          {classes.map((cls) => (
            <div
              key={cls.id}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: 'var(--sp-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: 'var(--sp-3)',
                }}
              >
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: 0, color: 'var(--ink)' }}>
                    {cls.name}
                  </h2>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                    Sort Index: {cls.sort_order}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSectionModal({ open: true, classId: cls.id, className: cls.name })}
                  >
                    + Add Section
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSubjectModal({ open: true, classId: cls.id, className: cls.name })}
                  >
                    + Assign Subject
                  </Button>
                </div>
              </div>

              {/* Sections List */}
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                  Sections ({cls.sections.length})
                </strong>
                {cls.sections.length > 0 ? (
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    {cls.sections.map((s) => (
                      <span
                        key={s.id}
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius)',
                          padding: 'var(--sp-1) var(--sp-3)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        Section {s.name} {s.teacher_name ? `(Teacher: ${s.teacher_name})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 'var(--sp-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                    No sections added yet. Click &ldquo;+ Add Section&rdquo;.
                  </p>
                )}
              </div>

              {/* Subjects List */}
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                  Assigned Subjects ({cls.subjects.length})
                </strong>
                {cls.subjects.length > 0 ? (
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    {cls.subjects.map((sub) => (
                      <span
                        key={sub.id}
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius)',
                          padding: 'var(--sp-1) var(--sp-3)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        {sub.subject_name} ({sub.full_marks}/{sub.pass_marks}) {sub.teacher_name ? `&bull; ${sub.teacher_name}` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 'var(--sp-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                    No subjects assigned yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Section Dialog */}
      <Dialog
        open={sectionModal.open}
        onClose={() => setSectionModal({ open: false, classId: null, className: '' })}
        title={`Add Section to ${sectionModal.className}`}
      >
        <form onSubmit={handleAddSection} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Field
            label="Section Name"
            required
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g. A, B, C"
          />

          <Field
            label="Class Teacher"
            as="select"
            value={sectionTeacherId}
            onChange={(e) => setSectionTeacherId(e.target.value)}
            options={[
              { label: 'Unassigned', value: '' },
              ...teachers.map((t) => ({ label: t.name, value: String(t.id) })),
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setSectionModal({ open: false, classId: null, className: '' })}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Section
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Assign Subject Dialog */}
      <Dialog
        open={subjectModal.open}
        onClose={() => setSubjectModal({ open: false, classId: null, className: '' })}
        title={`Assign Subject to ${subjectModal.className}`}
      >
        <form onSubmit={handleAssignSubject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Field
            label="Select Subject"
            as="select"
            required
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            options={[
              { label: 'Choose a subject...', value: '' },
              ...subjects.map((s) => ({ label: s.name, value: String(s.id) })),
            ]}
          />

          <Field
            label="Subject Teacher"
            as="select"
            value={subjectTeacherId}
            onChange={(e) => setSubjectTeacherId(e.target.value)}
            options={[
              { label: 'Unassigned', value: '' },
              ...teachers.map((t) => ({ label: t.name, value: String(t.id) })),
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
            <Field
              label="Full Marks"
              type="number"
              required
              value={String(fullMarks)}
              onChange={(e) => setFullMarks(parseInt(e.target.value, 10))}
            />

            <Field
              label="Pass Marks"
              type="number"
              required
              value={String(passMarks)}
              onChange={(e) => setPassMarks(parseInt(e.target.value, 10))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setSubjectModal({ open: false, classId: null, className: '' })}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Subject
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create Global Subject Dialog */}
      <Dialog
        open={createSubjectOpen}
        onClose={() => setCreateSubjectOpen(false)}
        title="Add New Subject"
      >
        <form onSubmit={handleCreateGlobalSubject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Field
            label="Subject Name"
            required
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g. Mathematics, Science, Social Studies, Nepali"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setCreateSubjectOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Subject
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
