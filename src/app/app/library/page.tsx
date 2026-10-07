'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import styles from './Library.module.css';

interface BookItem {
  id: number;
  accession_no: string;
  title: string;
  author: string | null;
  category: string | null;
  copies: number;
  borrowed: number;
  available: number;
}

interface LoanItem {
  id: number;
  book_id: number;
  book_title: string;
  accession_no: string;
  book_author: string | null;
  student_name: string | null;
  admission_no: string | null;
  class_name: string | null;
  section_name: string | null;
  staff_name: string | null;
  issued_on: string;
  due_on: string;
  returned_on: string | null;
  computed_status: 'active' | 'overdue' | 'returned';
}

interface StudentOption {
  id: number;
  full_name: string;
  admission_no: string;
  class_name?: string;
  section_name?: string;
}

interface StaffOption {
  id: number;
  name: string;
  role: string;
}

export default function LibraryManagementPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'active' | 'overdue' | 'history'>('catalog');
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown options
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);

  // Dialog: Add Book
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    accession_no: '',
    title: '',
    author: '',
    category: '',
    copies: 1,
  });

  // Dialog: Issue Book
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    book_id: '',
    borrower_type: 'student' as 'student' | 'staff',
    borrower_id: '',
    issued_on: new Date().toISOString().split('T')[0],
    due_on: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'catalog') {
        const res = await fetch(`/api/library/books?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const d = await res.json();
          setBooks(d.items || []);
        }
      } else {
        const statusParam = activeTab === 'history' ? 'all' : activeTab;
        const res = await fetch(`/api/library/loans?status=${statusParam}&q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const d = await res.json();
          setLoans(d.items || []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load students and staff for issue dialog
  useEffect(() => {
    fetch('/api/students?pageSize=200')
      .then((r) => r.json())
      .then((d) => setStudents(d.items || []))
      .catch(() => {});

    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setStaff(d.items || []))
      .catch(() => {});
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add book');
      }
      setIsAddBookOpen(false);
      setBookForm({ accession_no: '', title: '', author: '', category: '', copies: 1 });
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error adding book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue book');
      }
      setIsIssueOpen(false);
      setIssueForm({
        book_id: '',
        borrower_type: 'student',
        borrower_id: '',
        issued_on: new Date().toISOString().split('T')[0],
        due_on: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error issuing book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = async (loanId: number) => {
    if (!confirm('Confirm return of this borrowed book?')) return;
    try {
      const res = await fetch(`/api/library/loans/${loanId}/return`, {
        method: 'POST',
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Columns for Catalog
  const bookColumns: Column<BookItem>[] = [
    { key: 'accession_no', label: 'Accession No.', render: (b) => <strong>{b.accession_no}</strong> },
    { key: 'title', label: 'Title', render: (b) => b.title },
    { key: 'author', label: 'Author', render: (b) => b.author || '—' },
    { key: 'category', label: 'Category', render: (b) => b.category || 'General' },
    { key: 'copies', label: 'Total Copies', render: (b) => b.copies },
    {
      key: 'available',
      label: 'Available',
      render: (b) => (
        <span className={b.available > 0 ? styles.availTag : styles.availNone}>
          {b.available} of {b.copies}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (b) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={b.available <= 0}
          onClick={() => {
            setIssueForm((prev) => ({ ...prev, book_id: String(b.id) }));
            setFormError('');
            setIsIssueOpen(true);
          }}
        >
          Issue
        </Button>
      ),
    },
  ];

  // Columns for Loans
  const loanColumns: Column<LoanItem>[] = [
    {
      key: 'book_title',
      label: 'Book',
      render: (l) => (
        <div>
          <div><strong>{l.book_title}</strong></div>
          <small style={{ color: 'var(--ink-soft)' }}>Acc: {l.accession_no}</small>
        </div>
      ),
    },
    {
      key: 'student_name',
      label: 'Borrower',
      render: (l) => {
        if (l.student_name) {
          return (
            <div>
              <div>{l.student_name}</div>
              <small style={{ color: 'var(--ink-soft)' }}>
                Adm: {l.admission_no} {l.class_name ? `(${l.class_name})` : ''}
              </small>
            </div>
          );
        }
        return <div>{l.staff_name || 'Staff member'}</div>;
      },
    },
    { key: 'issued_on', label: 'Issued On' },
    { key: 'due_on', label: 'Due On' },
    {
      key: 'computed_status',
      label: 'Status',
      render: (l) => {
        let cls = styles.statusActive;
        let text = 'Active';
        if (l.computed_status === 'overdue') {
          cls = styles.statusOverdue;
          text = 'Overdue';
        } else if (l.computed_status === 'returned') {
          cls = styles.statusReturned;
          text = `Returned (${l.returned_on})`;
        }
        return <span className={`${styles.statusPill} ${cls}`}>{text}</span>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (l) => {
        if (l.returned_on) return <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>Completed</span>;
        return (
          <Button variant="secondary" size="sm" onClick={() => handleReturnBook(l.id)}>
            Return
          </Button>
        );
      },
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Library Management"
        description="Catalog circulation, book availability tracking, and student loan management."
        actions={
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setFormError('');
                setIsIssueOpen(true);
              }}
            >
              Issue Book
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setFormError('');
                setIsAddBookOpen(true);
              }}
            >
              + Add New Book
            </Button>
          </div>
        }
      />

      {/* Tabs bar */}
      <div className={styles.tabList} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeTab === 'catalog' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Book Catalog
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Loans
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'overdue' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue Loans
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Full Loan History
        </button>
      </div>

      {/* Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.leftControls}>
          <input
            type="search"
            placeholder="Search title, author, borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: 'var(--sp-2) var(--sp-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              width: '280px',
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      {activeTab === 'catalog' ? (
        <DataTable
          columns={bookColumns}
          rows={books}
          loading={loading}
          emptyText="No books found in the catalog."
        />
      ) : (
        <DataTable
          columns={loanColumns}
          rows={loans}
          loading={loading}
          emptyText={`No ${activeTab} loans found.`}
        />
      )}

      {/* Add Book Dialog */}
      <Dialog
        open={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        title="Add New Book to Library"
      >
        <form onSubmit={handleAddBook} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}
          <div className={styles.formGrid}>
            <Field label="Accession Number *" required>
              <input
                type="text"
                required
                value={bookForm.accession_no}
                onChange={(e) => setBookForm({ ...bookForm, accession_no: e.target.value })}
                placeholder="e.g. ACC-2083-001"
              />
            </Field>
            <Field label="Total Copies *" required>
              <input
                type="number"
                min="1"
                required
                value={bookForm.copies}
                onChange={(e) => setBookForm({ ...bookForm, copies: parseInt(e.target.value, 10) || 1 })}
              />
            </Field>
          </div>
          <Field label="Book Title *" required>
            <input
              type="text"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              placeholder="e.g. Asmita Optional Mathematics Class 9"
            />
          </Field>
          <div className={styles.formGrid}>
            <Field label="Author / Publisher">
              <input
                type="text"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                placeholder="e.g. D.R. Simkhada"
              />
            </Field>
            <Field label="Category / Genre">
              <input
                type="text"
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                placeholder="e.g. Mathematics, Science, Literature"
              />
            </Field>
          </div>
          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsAddBookOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Save Book'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog
        open={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        title="Issue Library Book"
      >
        <form onSubmit={handleIssueBook} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <Field label="Select Book *" required>
            <select
              required
              value={issueForm.book_id}
              onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
            >
              <option value="">-- Choose Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={b.available <= 0}>
                  {b.title} [{b.accession_no}] ({b.available} available)
                </option>
              ))}
            </select>
          </Field>

          <Field label="Borrower Type *" required>
            <div style={{ display: 'flex', gap: 'var(--sp-4)', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="borrower_type"
                  value="student"
                  checked={issueForm.borrower_type === 'student'}
                  onChange={() => setIssueForm({ ...issueForm, borrower_type: 'student', borrower_id: '' })}
                />
                Student
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="borrower_type"
                  value="staff"
                  checked={issueForm.borrower_type === 'staff'}
                  onChange={() => setIssueForm({ ...issueForm, borrower_type: 'staff', borrower_id: '' })}
                />
                Staff Member
              </label>
            </div>
          </Field>

          {issueForm.borrower_type === 'student' ? (
            <Field label="Select Student *" required>
              <select
                required
                value={issueForm.borrower_id}
                onChange={(e) => setIssueForm({ ...issueForm, borrower_id: e.target.value })}
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_no})
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Select Staff Member *" required>
              <select
                required
                value={issueForm.borrower_id}
                onChange={(e) => setIssueForm({ ...issueForm, borrower_id: e.target.value })}
              >
                <option value="">-- Choose Staff --</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className={styles.formGrid}>
            <Field label="Issue Date *" required>
              <input
                type="date"
                required
                value={issueForm.issued_on}
                onChange={(e) => setIssueForm({ ...issueForm, issued_on: e.target.value })}
              />
            </Field>
            <Field label="Due Date *" required>
              <input
                type="date"
                required
                value={issueForm.due_on}
                onChange={(e) => setIssueForm({ ...issueForm, due_on: e.target.value })}
              />
            </Field>
          </div>

          <div className={styles.dialogActions}>
            <Button variant="secondary" type="button" onClick={() => setIsIssueOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Issuing...' : 'Confirm Loan'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
