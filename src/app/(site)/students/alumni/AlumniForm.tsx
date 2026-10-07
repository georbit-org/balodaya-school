'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from '../students.module.css';

export function AlumniForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    batchYear: '',
    email: '',
    phone: '',
    message: '',
    website: '',
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
      setError('Please enter your full name.');
      return;
    }
    if (!formData.batchYear.trim()) {
      setError('Please enter your graduation / batch year.');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please write a brief note or message.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'alumni',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Alumni Registration - ${formData.name} (${formData.batchYear})`,
          body: formData.message,
          extra: { batchYear: formData.batchYear },
          website: formData.website,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit message.');
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
          Thank You, Balodaya Alum!
        </h3>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          Your alumni profile message has been received. Following review by the school editorial board, it will appear in the alumni network gallery.
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
        label="Full Name"
        required
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your name"
      />

      <Field
        label="Graduation Batch Year"
        required
        name="batchYear"
        value={formData.batchYear}
        onChange={handleChange}
        placeholder="e.g. 2078 B.S. / 2021"
      />

      <div className={styles.formRow}>
        <Field
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com (optional)"
        />

        <Field
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 98XXXXXXXX (optional)"
        />
      </div>

      <Field
        label="Your Message / Career Note"
        as="textarea"
        required
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={4}
        placeholder="Share a reflection, current occupation, or message to current students"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Submit Alumni Note
        </Button>
      </div>
    </form>
  );
}
