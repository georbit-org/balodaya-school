'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from '../students.module.css';

export function TCRequestForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    admissionNo: '',
    classLevel: '',
    phone: '',
    reason: '',
    website: '', // honeypot
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.website) return;

    if (!formData.name.trim()) {
      setError('Please enter student full name.');
      return;
    }
    if (!formData.admissionNo.trim()) {
      setError('Please enter student admission number.');
      return;
    }
    if (!formData.classLevel.trim()) {
      setError('Please enter the current or last attended class.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 9) {
      setError('Please enter a valid contact phone number.');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Please state the reason for requesting the transfer certificate.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'transfer-certificate',
          name: formData.name,
          phone: formData.phone,
          subject: `TC Request - ${formData.name} (${formData.admissionNo})`,
          body: formData.reason,
          extra: {
            admissionNo: formData.admissionNo,
            classLevel: formData.classLevel,
          },
          website: formData.website,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit request.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 'var(--sp-6)', backgroundColor: 'var(--success-wash)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <h3 style={{ margin: 0, color: 'var(--success)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)' }}>
          Request Received
        </h3>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          Your Transfer Certificate application has been logged with the administration office. The office will verify clearance records and contact you on <strong>{formData.phone}</strong> when ready for collection.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.formGrid} onSubmit={handleSubmit} noValidate>
      {error && (
        <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-wash)', padding: 'var(--sp-3)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />

      <Field
        label="Student Full Name"
        required
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter student's official name"
      />

      <div className={styles.formRow}>
        <Field
          label="Admission Number"
          required
          name="admissionNo"
          value={formData.admissionNo}
          onChange={handleChange}
          placeholder="e.g. BAL-2081-0024"
        />

        <Field
          label="Class / Grade"
          required
          name="classLevel"
          value={formData.classLevel}
          onChange={handleChange}
          placeholder="e.g. Class 10"
        />
      </div>

      <Field
        label="Contact Phone Number"
        type="tel"
        required
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="e.g. 98XXXXXXXX"
      />

      <Field
        label="Reason for Transfer Certificate"
        as="textarea"
        required
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        rows={4}
        placeholder="State reason (relocation, higher education, school change, etc.)"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Submit TC Application
        </Button>
      </div>
    </form>
  );
}
