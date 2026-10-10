'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNpr } from '@/lib/format';
import { adToBs } from '@/lib/bs-date';
import styles from './Payments.module.css';

interface PaymentItem {
  id: number;
  receipt_no: string;
  invoice_id: number;
  amount: number;
  method: string;
  reference: string | null;
  paid_on: string;
  created_at: string;
  collector_name: string | null;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_name: string | null;
  section_name: string | null;
  invoice_title: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Record Payment Dialog State
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [invoiceIdInput, setInvoiceIdInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [methodInput, setMethodInput] = useState('cash');
  const [refInput, setRefInput] = useState('');
  const [paidOnInput, setPaidOnInput] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPayments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (methodFilter) params.set('method', methodFilter);

    fetch(`/api/fees/payments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setPayments(data.items);
      })
      .catch((err) => console.error('Failed to load payments:', err))
      .finally(() => setLoading(false));
  }, [search, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashTotal = payments.filter((p) => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
  const digitalTotal = totalCollected - cashTotal;

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: parseInt(invoiceIdInput, 10),
          amount: parseFloat(amountInput),
          method: methodInput,
          reference: refInput || null,
          paid_on: paidOnInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      setRecordDialogOpen(false);
      setInvoiceIdInput('');
      setAmountInput('');
      setRefInput('');
      fetchPayments();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Payments &amp; Collections"
        description="Official ledger of fee receipts, cash daybook reconciliations, and payment histories."
        actions={
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Link href="/api/reports/payments" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" iconLeft={<Icon name="download" size={16} />}>
                Export CSV
              </Button>
            </Link>
            <Button
              variant="primary"
              iconLeft={<Icon name="plus" size={16} />}
              onClick={() => setRecordDialogOpen(true)}
            >
              Record Payment
            </Button>
          </div>
        }
      />

      {/* KPI METRIC STRIP */}
      <div className={styles.kpiGrid}>
        <Stat
          label="Total Collections (Ledger)"
          value={formatNpr(totalCollected)}
          subtext={`${payments.length} receipt(s) tracked`}
        />
        <Stat
          label="Cash Receipts"
          value={formatNpr(cashTotal)}
          subtext="On-counter cashier payments"
        />
        <Stat
          label="Digital / Bank Transfer"
          value={formatNpr(digitalTotal)}
          subtext="eSewa, Khalti, direct bank deposits"
        />
      </div>

      {/* SEARCH & METHOD FILTER */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, receipt no, or admission no…"
            className={styles.searchInput}
          />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <Button variant="ghost" iconLeft={<Icon name="refresh" size={14} />} onClick={fetchPayments}>
          Refresh
        </Button>
      </div>

      {/* PAYMENTS DATA TABLE */}
      <Section title="Receipts Log" description={`Displaying ${payments.length} transaction(s)`}>
        {loading ? (
          <Skeleton variant="tableRows" rows={6} />
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: 0, padding: 'var(--sp-4) 0' }}>
            No payments matched the search criteria.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student &amp; Class</th>
                  <th>Invoice Item</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date (B.S. / A.D.)</th>
                  <th>Collected By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const bsInfo = adToBs(p.paid_on);

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/app/print/receipt/${p.id}`} className={styles.receiptLink}>
                          {p.receipt_no}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.studentMeta}>
                          <span className={styles.studentName}>{p.student_name}</span>
                          <span className={styles.studentClass}>
                            {p.admission_no} • {p.class_name ? `${p.class_name} '${p.section_name}'` : 'Active'}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-soft)' }}>
                        {p.invoice_title}
                      </td>
                      <td>
                        <span className={styles.amount}>{formatNpr(p.amount)}</span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            p.method === 'cash'
                              ? 'neutral'
                              : p.method === 'bank'
                              ? 'info'
                              : 'success'
                          }
                        >
                          {p.method.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        <div>{bsInfo.displayNe}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{p.paid_on}</div>
                      </td>
                      <td style={{ color: 'var(--ink-soft)' }}>
                        {p.collector_name || 'Accounts Office'}
                      </td>
                      <td className={styles.actionCell}>
                        <Link href={`/app/print/receipt/${p.id}`} target="_blank">
                          <Button size="sm" variant="secondary" iconLeft={<Icon name="print" size={14} />}>
                            Receipt
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* RECORD PAYMENT DIALOG */}
      <Dialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        title="Record Fee Payment &amp; Issue Receipt"
      >
        <form onSubmit={handleRecordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {errorMsg && (
            <div style={{ padding: '8px 12px', background: 'var(--danger-wash)', color: 'var(--danger)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' }}>
              {errorMsg}
            </div>
          )}

          <Field
            label="Invoice ID"
            type="number"
            value={invoiceIdInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceIdInput(e.target.value)}
            placeholder="e.g. 1"
            required
            hint="Find Invoice ID from the Fees &amp; Invoices tab"
          />

          <Field
            label="Amount (NPR)"
            type="number"
            value={amountInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountInput(e.target.value)}
            placeholder="e.g. 2500"
            required
          />

          <Field
            label="Payment Method"
            as="select"
            value={methodInput}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethodInput(e.target.value)}
            options={[
              { value: 'cash', label: 'Cash at Counter' },
              { value: 'bank', label: 'Direct Bank Deposit' },
              { value: 'esewa', label: 'eSewa Digital Wallet' },
              { value: 'khalti', label: 'Khalti Digital Wallet' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />

          <Field
            label="Transaction / Reference Note"
            type="text"
            value={refInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefInput(e.target.value)}
            placeholder="e.g. Bank voucher #10492 or cheque no."
          />

          <Field
            label="Payment Date (A.D.)"
            type="date"
            value={paidOnInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaidOnInput(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <Button variant="ghost" onClick={() => setRecordDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Save &amp; Generate Receipt
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
