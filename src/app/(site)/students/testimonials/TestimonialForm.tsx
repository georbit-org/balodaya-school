'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from '../students.module.css';

export function TestimonialForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Parent',
    phone: '',
    email: '',
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
    if (!formData.message.trim()) {
      setError('Please write your testimonial message.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'testimonial',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Testimonial from ${formData.name} (${formData.role})`,
          body: formData.message,
          extra: { role: formData.role },
          website: formData.website,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit testimonial.');
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
          Thank You!
        </h3>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          Your testimonial has been submitted. It will be reviewed by the school administration before publication.
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
        label="Your Role / Association"
        as="select"
        required
        name="role"
        value={formData.role}
        onChange={handleChange}
        options={[
          { label: 'Parent / Guardian', value: 'Parent' },
          { label: 'Alumnus / Former Student', value: 'Alumnus' },
          { label: 'Community Member', value: 'Community Member' },
        ]}
      />

      <div className={styles.formRow}>
        <Field
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 98XXXXXXXX (optional)"
        />

        <Field
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com (optional)"
        />
      </div>

      <Field
        label="Testimonial / Experience"
        as="textarea"
        required
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={4}
        placeholder="Share your experience with Balodaya School's education and environment"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Submit Testimonial
        </Button>
      </div>
    </form>
  );
}
