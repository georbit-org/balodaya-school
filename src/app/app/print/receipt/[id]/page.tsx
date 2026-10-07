'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from './Receipt.module.css';

interface ReceiptData {
  payment: {
    id: number;
    receipt_no: string;
    amount: number;
    method: string;
    reference: string | null;
    paid_on: string;
    received_by_name: string | null;
    invoice_no: string;
    invoice_title: string;
    invoice_total: number;
    student_name: string;
    admission_no: string;
    class_name: string | null;
    section_name: string | null;
    guardian_name: string | null;
  };
  items: Array<{ description: string; amount: number }>;
  totalPaid: number;
  remainingBalance: number;
}

export default function ReceiptPrintPage() {
  const params = useParams();
  const paymentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paymentId) return;
    fetch(`/api/fees/payments/${paymentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load receipt.');
        }
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading official receipt...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#c5221f' }}>
        <h3>Receipt Error</h3>
        <p>{error || 'Receipt record not found.'}</p>
      </div>
    );
  }

  const { payment, items, totalPaid, remainingBalance } = data;

  return (
    <div className={styles.container}>
      <div className={styles.noPrintBar}>
        <span style={{ fontSize: '14px', color: '#666' }}>Official Fee Payment Receipt</span>
        <Button variant="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className={styles.schoolHeader}>
        <div className={styles.schoolName}>Balodaya Secondary English Boarding School</div>
        <div className={styles.schoolAddress}>
          Bheerkot-5, Bayarghari, Syangja, Nepal • Estd. 2063 B.S.
        </div>
        <div className={styles.docTitle}>Official Money Receipt</div>
      </div>

      <div className={styles.receiptMetaRow}>
        <div>
          Receipt No: <strong>{payment.receipt_no}</strong>
        </div>
        <div>
          Date: <strong>{payment.paid_on}</strong>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Student Name:</span>
          <span className={styles.metaValue}>{payment.student_name}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Admission No:</span>
          <span className={styles.metaValue}>{payment.admission_no}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Class & Section:</span>
          <span className={styles.metaValue}>
            {payment.class_name} ({payment.section_name})
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Guardian:</span>
          <span className={styles.metaValue}>{payment.guardian_name || '—'}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Payment Mode:</span>
          <span className={styles.metaValue} style={{ textTransform: 'uppercase' }}>
            {payment.method}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Txn Reference:</span>
          <span className={styles.metaValue}>{payment.reference || 'None'}</span>
        </div>
      </div>

      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>SN</th>
            <th>Fee Description ({payment.invoice_title})</th>
            <th style={{ width: '120px' }} className={styles.right}>Amount (NPR)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{item.description}</td>
              <td className={styles.right}>Rs. {item.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totalsBlock}>
        <div className={styles.totalsRow}>
          <span>Invoice Total:</span>
          <span>Rs. {payment.invoice_total.toLocaleString()}</span>
        </div>
        <div className={styles.totalsRow}>
          <span>Total Paid to Date:</span>
          <span>Rs. {totalPaid.toLocaleString()}</span>
        </div>
        <div className={styles.totalsRow}>
          <span>Remaining Balance:</span>
          <span style={{ color: remainingBalance > 0 ? '#c5221f' : '#137333', fontWeight: 700 }}>
            Rs. {remainingBalance.toLocaleString()}
          </span>
        </div>
        <div className={`${styles.totalsRow} ${styles.bold}`}>
          <span>Amount Paid on Receipt:</span>
          <span>Rs. {payment.amount.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.signatureArea}>
        <div className={styles.sigBlock}>
          <div className={styles.sigLine}>Parent / Guardian</div>
        </div>
        <div className={styles.sigBlock}>
          <div className={styles.sigLine}>
            Cashier ({payment.received_by_name || 'Accounts'})
          </div>
        </div>
      </div>
    </div>
  );
}
