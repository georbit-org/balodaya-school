'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export function JobApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    website: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.website) return;

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 9) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('message', formData.message);
      data.append('website', formData.website);
      if (file) {
        data.append('cv', file);
      }

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to submit application.');
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
          Application Received
        </h3>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          Thank you for applying to Balodaya Secondary School. Your application has been submitted to the human resources office. We will reach out on <strong>{formData.phone}</strong> if your credentials match upcoming faculty openings.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
        label="Full Name"
        required
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter your legal name"
      />

      <Field
        label="Phone Number"
        type="tel"
        required
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="e.g. 98XXXXXXXX"
      />

      <Field
        label="Email Address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="email@example.com (optional)"
      />

      <div className={styles.fileInputWrapper}>
        <label className={styles.fileLabel} htmlFor="cv-upload">
          Curriculum Vitae / Resume (PDF or DOCX)
        </label>
        <input
          id="cv-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      </div>

      <Field
        label="Cover Note / Subject Expertise"
        as="textarea"
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={3}
        placeholder="Outline your teaching experience, grade levels, or administrative background"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Submit Application
        </Button>
      </div>
    </form>
  );
}
