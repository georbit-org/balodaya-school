'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { useSession } from '@/components/auth/SessionProvider';
import { formatNpr } from '@/lib/format';
import styles from './Fees.module.css';

interface InvoiceItem {
  id: number;
  invoice_no: string;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_name: string | null;
  section_name: string | null;
  title: string;
  due_date: string | null;
  total: number;
  paid_amount: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  created_at: string;
  latest_payment_id?: number | null;
}

interface FeeStructureItem {
  id: number;
  class_id: number;
  class_name: string;
  fee_head_id: number;
  fee_head_name: string;
  amount: number;
}

interface DueItem {
  student_id: number;
  admission_no: string;
  student_name: string;
  class_name: string | null;
  section_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  total_billed: number;
  total_paid: number;
  balance_due: number;
}

export default function FeesManagementPage() {
  const { user, can } = useSession();
  const isParentOrStudent = user?.role === 'parent' || user?.role === 'student';
  const isPrincipal = user?.role === 'principal';

  const [activeTab, setActiveTab] = useState<'invoices' | 'generate' | 'structure' | 'dues'>('invoices');

  // Invoices Tab State
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [totals, setTotals] = useState({ billed: 0, paid: 0, balance: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);

  // Payment Dialog State
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceItem | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    paid_on: new Date().toISOString().slice(0, 10),
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [recentReceiptId, setRecentReceiptId] = useState<number | null>(null);

  // Generate Invoices Tab State
  const [genForm, setGenForm] = useState({
    class_id: '',
    title: '',
    due_date: '',
  });
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  // Fee Structure Tab State
  const [feeHeads, setFeeHeads] = useState<{ id: number; name: string }[]>([]);
  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [structForm, setStructForm] = useState({
    class_id: '',
    fee_head_id: '',
    amount: '',
  });
  const [structSubmitting, setStructSubmitting] = useState(false);

  // Dues Report Tab State
  const [dues, setDues] = useState<DueItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [duesLoading, setDuesLoading] = useState(false);

  // Load Classes
  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        setClasses(d.classes || []);
        if (d.classes?.length > 0) {
          if (!genForm.class_id) setGenForm((prev) => ({ ...prev, class_id: String(d.classes[0].id) }));
          if (!structForm.class_id) setStructForm((prev) => ({ ...prev, class_id: String(d.classes[0].id) }));
        }
      })
      .catch(() => {});
  }, [genForm.class_id, structForm.class_id]);

  // Load Invoices
  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (classFilter) params.set('class_id', classFilter);

      const res = await fetch(`/api/fees/invoices?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setInvoices(d.items || []);
        setTotals({
          billed: d.totalBilled || 0,
          paid: d.totalPaid || 0,
          balance: d.totalBalance || 0,
        });
      }
    } finally {
      setLoadingInvoices(false);
    }
  }, [search, statusFilter, classFilter]);

  // Load Structure
  const loadStructure = useCallback(async () => {
    const res = await fetch('/api/fees/structure');
    if (res.ok) {
      const d = await res.json();
      setFeeHeads(d.heads || []);
      setStructures(d.structures || []);
      if (d.heads?.length > 0 && !structForm.fee_head_id) {
        setStructForm((prev) => ({ ...prev, fee_head_id: String(d.heads[0].id) }));
      }
    }
  }, [structForm.fee_head_id]);

  // Load Dues
  const loadDues = useCallback(async () => {
    setDuesLoading(true);
    try {
      const res = await fetch('/api/fees/dues');
      if (res.ok) {
        const d = await res.json();
        setDues(d.dues || []);
        setTotalOutstanding(d.totalOutstanding || 0);
      }
    } finally {
      setDuesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'invoices') loadInvoices();
    else if (activeTab === 'structure') loadStructure();
    else if (activeTab === 'dues') loadDues();
  }, [activeTab, loadInvoices, loadStructure, loadDues]);

  // Handle Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    setPaymentError('');
    setPaymentSubmitting(true);

    try {
      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: paymentInvoice.id,
          amount: parseInt(paymentForm.amount, 10),
          method: paymentForm.method,
          reference: paymentForm.reference,
          paid_on: paymentForm.paid_on,
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setRecentReceiptId(d.paymentId);
        loadInvoices();
      } else {
        setPaymentError(d.error || 'Failed to record payment.');
      }
    } catch {
      setPaymentError('Network error while processing payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Handle Generate Invoices
  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenResult(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/fees/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(genForm.class_id, 10),
          title: genForm.title,
          due_date: genForm.due_date || null,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setGenResult(`Success: Generated ${d.generatedCount} invoices (${d.skippedCount} skipped as duplicate).`);
        setGenForm((prev) => ({ ...prev, title: '', due_date: '' }));
      } else {
        setGenResult(`Error: ${d.error || 'Generation failed'}`);
      }
    } catch {
      setGenResult('Network error while generating invoices.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Fee Structure Update
  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructSubmitting(true);
    try {
      const res = await fetch('/api/fees/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(structForm.class_id, 10),
          fee_head_id: parseInt(structForm.fee_head_id, 10),
          amount: parseInt(structForm.amount, 10),
        }),
      });
      if (res.ok) {
        setStructForm((prev) => ({ ...prev, amount: '' }));
        loadStructure();
      }
    } finally {
      setStructSubmitting(false);
    }
  };

  const renderStatus = (st: InvoiceItem['status']) => {
    switch (st) {
      case 'Paid':
        return <span className={styles.badgePaid}>Paid</span>;
      case 'Partial':
        return <span className={styles.badgePartial}>Partial</span>;
      case 'Overdue':
        return <span className={styles.badgeOverdue}>Overdue</span>;
      default:
        return <span className={styles.badgeUnpaid}>Unpaid</span>;
    }
  };

  const invoiceColumns: Column<InvoiceItem>[] = [
    { key: 'invoice_no', header: 'Invoice No', render: (i: InvoiceItem) => <code>{i.invoice_no}</code> },
    {
      key: 'student',
      header: 'Student',
      render: (i: InvoiceItem) => (
        <div>
          <strong>{i.student_name}</strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            {i.admission_no} • {i.class_name ? `${i.class_name} (${i.section_name})` : '—'}
          </div>
        </div>
      ),
    },
    { key: 'title', header: 'Description', render: (i: InvoiceItem) => i.title },
    { key: 'total', header: 'Billed', render: (i: InvoiceItem) => formatNpr(i.total) },
    { key: 'paid', header: 'Paid', render: (i: InvoiceItem) => formatNpr(i.paid_amount) },
    {
      key: 'balance',
      header: 'Balance',
      render: (i: InvoiceItem) =>
        i.balance > 0 ? (
          <strong style={{ color: '#c5221f' }}>{formatNpr(i.balance)}</strong>
        ) : (
          <span style={{ color: '#137333' }}>{formatNpr(0)}</span>
        ),
    },
    { key: 'status', header: 'Status', render: (i: InvoiceItem) => renderStatus(i.status) },
    {
      key: 'actions',
      header: 'Actions',
      render: (i: InvoiceItem) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {can('fee.record') && i.balance > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPaymentInvoice(i);
                setPaymentForm({
                  amount: String(i.balance),
                  method: 'cash',
                  reference: '',
                  paid_on: new Date().toISOString().slice(0, 10),
                });
                setPaymentError('');
                setRecentReceiptId(null);
              }}
            >
              Collect
            </Button>
          )}
          {i.latest_payment_id && (
            <Link href={`/app/print/receipt/${i.latest_payment_id}`} target="_blank">
              <Button variant="secondary" size="sm">
                Receipt
              </Button>
            </Link>
          )}
          {!can('fee.record') && i.balance > 0 && !i.latest_payment_id && (
            <span style={{ fontSize: 'var(--text-xs)', color: '#c5221f', fontWeight: 600 }}>Unsettled</span>
          )}
        </div>
      ),
    },
  ];

  const duesColumns: Column<DueItem>[] = [
    { key: 'admission_no', header: 'Admission No', render: (d: DueItem) => <code>{d.admission_no}</code> },
    { key: 'student_name', header: 'Student Name', render: (d: DueItem) => <strong>{d.student_name}</strong> },
    { key: 'class', header: 'Class & Section', render: (d: DueItem) => `${d.class_name} (${d.section_name})` },
    {
      key: 'guardian',
      header: 'Guardian Contact',
      render: (d: DueItem) => (
        <div>
          <div>{d.guardian_name || '—'}</div>
          {d.guardian_phone && <small style={{ color: 'var(--ink-muted)' }}>{d.guardian_phone}</small>}
        </div>
      ),
    },
    { key: 'billed', header: 'Total Billed', render: (d: DueItem) => formatNpr(d.total_billed) },
    { key: 'paid', header: 'Total Paid', render: (d: DueItem) => formatNpr(d.total_paid) },
    {
      key: 'due',
      header: 'Outstanding Due',
      render: (d: DueItem) => <strong style={{ color: '#c5221f' }}>{formatNpr(d.balance_due)}</strong>,
    },
  ];

  const pageTitle = user?.role === 'student'
    ? 'My Fee Invoices & Receipts'
    : user?.role === 'parent'
    ? "Children's Fee Invoices & Receipts"
    : 'Fee Management & Accounts';

  const pageDescription = user?.role === 'student'
    ? 'Review your fee billing records, check payment balances, and view/print official receipts.'
    : user?.role === 'parent'
    ? 'Review billing records and download official payment receipts for your children.'
    : 'Fee structures, monthly billing generation, receipt printing, and dues reporting.';

  return (
    <div>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      />

      {!isParentOrStudent && (
        <div className={styles.topTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices Ledger
          </button>
          {!isPrincipal && (
            <>
              <button
                className={`${styles.tabBtn} ${activeTab === 'generate' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('generate')}
              >
                Generate Invoices
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'structure' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('structure')}
              >
                Fee Structure
              </button>
            </>
          )}
          <button
            className={`${styles.tabBtn} ${activeTab === 'dues' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('dues')}
          >
            Dues Report
          </button>
        </div>
      )}

      {/* Tab 1: Invoices Ledger */}
      {activeTab === 'invoices' && (
        <div>
          <div className={styles.summaryCardsRow}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Billed</div>
              <div className={styles.summaryValue}>{formatNpr(totals.billed)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Paid</div>
              <div className={styles.summaryValue} style={{ color: '#137333' }}>
                {formatNpr(totals.paid)}
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Outstanding Dues</div>
              <div className={styles.summaryValue} style={{ color: '#c5221f' }}>
                {formatNpr(totals.balance)}
              </div>
            </div>
          </div>

          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder={isParentOrStudent ? 'Search invoices...' : 'Search by student name, admission no, or invoice no...'}
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {!isParentOrStudent && (
              <select
                className={styles.selectInput}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <select
              className={styles.selectInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <DataTable<InvoiceItem>
            columns={invoiceColumns}
            rows={invoices}
            keyExtractor={(i) => i.id}
            loading={loadingInvoices}
            emptyText="No invoices found."
          />
        </div>
      )}

      {/* Tab 2: Generate Invoices */}
      {activeTab === 'generate' && (
        <div style={{ maxWidth: '600px', background: 'var(--surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Generate Monthly Class Invoices</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
            Generates standardized invoices for all active students in the selected class based on the configured fee structure.
          </p>

          {genResult && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', background: genResult.startsWith('Success') ? '#e6f4ea' : '#fce8e6', color: genResult.startsWith('Success') ? '#137333' : '#c5221f' }}>
              {genResult}
            </div>
          )}

          <form onSubmit={handleGenerateInvoices} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field
              label="Select Class *"
              as="select"
              value={genForm.class_id}
              onChange={(e) => setGenForm({ ...genForm, class_id: e.target.value })}
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Field>

            <Field
              label="Invoice Title / Description *"
              value={genForm.title}
              onChange={(e) => setGenForm({ ...genForm, title: e.target.value })}
              placeholder="e.g. Baisakh 2083 Monthly Fees"
              required
            />

            <Field
              label="Payment Due Date"
              type="date"
              value={genForm.due_date}
              onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
            />

            <Button variant="primary" type="submit" disabled={generating}>
              {generating ? 'Generating Invoices...' : 'Generate Batch Invoices'}
            </Button>
          </form>
        </div>
      )}

      {/* Tab 3: Fee Structure */}
      {activeTab === 'structure' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Current Fee Structure by Class</h2>
              <DataTable<FeeStructureItem>
                columns={[
                  { key: 'class', header: 'Class', render: (s: FeeStructureItem) => <strong>{s.class_name}</strong> },
                  { key: 'head', header: 'Fee Category', render: (s: FeeStructureItem) => s.fee_head_name },
                  { key: 'amount', header: 'Monthly Amount', render: (s: FeeStructureItem) => `Rs. ${s.amount.toLocaleString()}` },
                ]}
                rows={structures}
                keyExtractor={(s) => s.id}
                emptyText="No fee structures configured yet."
              />
            </div>

            <div style={{ background: 'var(--surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', height: 'fit-content' }}>
              <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>Set Fee Head Amount</h3>
              <form onSubmit={handleSaveStructure} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Field
                  label="Class *"
                  as="select"
                  value={structForm.class_id}
                  onChange={(e) => setStructForm({ ...structForm, class_id: e.target.value })}
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Field>

                <Field
                  label="Fee Category *"
                  as="select"
                  value={structForm.fee_head_id}
                  onChange={(e) => setStructForm({ ...structForm, fee_head_id: e.target.value })}
                  required
                >
                  {feeHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Field>

                <Field
                  label="Amount (NPR) *"
                  type="number"
                  min="0"
                  value={structForm.amount}
                  onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })}
                  placeholder="e.g. 2500"
                  required
                />

                <Button variant="primary" type="submit" disabled={structSubmitting}>
                  {structSubmitting ? 'Saving...' : 'Save Fee Amount'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Dues Report */}
      {activeTab === 'dues' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                Total Outstanding Balance
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#c5221f' }}>
                Rs. {totalOutstanding.toLocaleString()}
              </div>
            </div>

            <a href="/api/fees/dues/export" download>
              <Button variant="secondary">Export Dues CSV</Button>
            </a>
          </div>

          <DataTable<DueItem>
            columns={duesColumns}
            rows={dues}
            keyExtractor={(d) => d.student_id}
            loading={duesLoading}
            emptyText="No students with outstanding dues."
          />
        </div>
      )}

      {/* Collect Payment Dialog */}
      <Dialog
        open={paymentInvoice !== null}
        onClose={() => setPaymentInvoice(null)}
        title="Collect Fee Payment"
      >
        {paymentInvoice && (
          <div>
            {recentReceiptId ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-lg)', fontWeight: 700, color: '#137333', marginBottom: 'var(--space-2)' }}>
                  <Icon name="check-circle" size={20} />
                  <span>Payment Received Successfully</span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
                  Receipt recorded for {paymentInvoice.student_name}.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                  <Link href={`/app/print/receipt/${recentReceiptId}`} target="_blank">
                    <Button variant="primary">Print Official Receipt</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => setPaymentInvoice(null)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {paymentError && (
                  <div style={{ padding: 'var(--space-2)', background: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: 'var(--text-sm)' }}>
                    {paymentError}
                  </div>
                )}

                <div style={{ padding: 'var(--space-3)', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)' }}>
                  <div><strong>Student:</strong> {paymentInvoice.student_name} ({paymentInvoice.admission_no})</div>
                  <div><strong>Invoice:</strong> {paymentInvoice.invoice_no} — {paymentInvoice.title}</div>
                  <div><strong>Invoice Total:</strong> Rs. {paymentInvoice.total.toLocaleString()}</div>
                  <div style={{ color: '#c5221f', fontWeight: 700 }}>
                    <strong>Remaining Balance:</strong> Rs. {paymentInvoice.balance.toLocaleString()}
                  </div>
                </div>

                <Field
                  label="Amount to Collect (NPR) *"
                  type="number"
                  min="1"
                  max={paymentInvoice.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <Field
                    label="Payment Method *"
                    as="select"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Deposit / Transfer</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                    <option value="other">Other</option>
                  </Field>

                  <Field
                    label="Payment Date *"
                    type="date"
                    value={paymentForm.paid_on}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paid_on: e.target.value })}
                    required
                  />
                </div>

                <Field
                  label="Transaction Reference / Note (Optional)"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="e.g. Bank Voucher No / eSewa Txn ID"
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button variant="secondary" type="button" onClick={() => setPaymentInvoice(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={paymentSubmitting}>
                    {paymentSubmitting ? 'Recording...' : 'Confirm Payment'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
