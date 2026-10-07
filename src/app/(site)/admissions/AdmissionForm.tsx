'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

const CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

export function AdmissionForm() {
  const [loading, setLoading] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentName: '',
    dob: '',
    gender: '',
    classApplying: 'Class 1',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    previousSchool: '',
    notes: '',
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
    setErrorMessage(null);

    // Honeypot check
    if (formData.website) {
      return;
    }

    if (!formData.studentName.trim() || formData.studentName.length < 2) {
      setErrorMessage("Please enter the student's full name (at least 2 characters).");
      return;
    }
    if (!formData.dob) {
      setErrorMessage('Please select a valid date of birth.');
      return;
    }
    if (!formData.guardianName.trim()) {
      setErrorMessage('Please enter parent / guardian name.');
      return;
    }
    const cleanPhone = formData.guardianPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      setErrorMessage('Please enter a valid phone number (9 to 15 digits).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccessReference(data.reference);
      setContactPhone(formData.guardianPhone);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successReference) {
    return (
      <div className={styles.successCard}>
        <h3 className={styles.successHeading}>Application Submitted Successfully</h3>
        <p className={styles.successText}>
          Your admission inquiry reference number is:
        </p>
        <div className={styles.referenceBadge}>{successReference}</div>
        <p className={styles.successText}>
          The school office will contact you on <strong>{contactPhone}</strong> regarding next steps and document verification.
        </p>
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setSuccessReference(null);
              setFormData({
                studentName: '',
                dob: '',
                gender: '',
                classApplying: 'Class 1',
                guardianName: '',
                guardianPhone: '',
                guardianEmail: '',
                address: '',
                previousSchool: '',
                notes: '',
                website: '',
              });
            }}
          >
            Submit Another Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-wash)', padding: 'var(--sp-3)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' }}>
          {errorMessage}
        </div>
      )}

      {/* Honeypot field */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        className={styles.honeypot}
      />

      <Field
        label="Student's Full Name"
        required
        value={formData.studentName}
        onChange={handleChange}
        name="studentName"
        placeholder="Enter student's legal name"
      />

      <div className={styles.formRow}>
        <Field
          label="Date of Birth"
          type="date"
          required
          value={formData.dob}
          onChange={handleChange}
          name="dob"
        />

        <Field
          label="Gender"
          as="select"
          value={formData.gender}
          onChange={handleChange}
          name="gender"
          options={[
            { label: 'Select gender...', value: '' },
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ]}
        />
      </div>

      <Field
        label="Class Applying For"
        as="select"
        required
        value={formData.classApplying}
        onChange={handleChange}
        name="classApplying"
        options={CLASSES.map((c) => ({ label: c, value: c }))}
      />

      <div className={styles.formRow}>
        <Field
          label="Parent / Guardian Name"
          required
          value={formData.guardianName}
          onChange={handleChange}
          name="guardianName"
          placeholder="Father / Mother / Guardian"
        />

        <Field
          label="Guardian Phone"
          type="tel"
          required
          value={formData.guardianPhone}
          onChange={handleChange}
          name="guardianPhone"
          placeholder="e.g. 98XXXXXXXX"
        />
      </div>

      <div className={styles.formRow}>
        <Field
          label="Guardian Email"
          type="email"
          value={formData.guardianEmail}
          onChange={handleChange}
          name="guardianEmail"
          placeholder="email@example.com (optional)"
        />

        <Field
          label="Previous School"
          value={formData.previousSchool}
          onChange={handleChange}
          name="previousSchool"
          placeholder="Name of previous institution (optional)"
        />
      </div>

      <Field
        label="Residential Address"
        value={formData.address}
        onChange={handleChange}
        name="address"
        placeholder="Municipality / Ward / Village (optional)"
      />

      <Field
        label="Additional Notes / Remarks"
        as="textarea"
        value={formData.notes}
        onChange={handleChange}
        name="notes"
        rows={3}
        placeholder="Any additional information (optional)"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Submit Online Application
        </Button>
      </div>
    </form>
  );
}
