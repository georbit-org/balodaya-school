'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
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
      setError('Please enter your message.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'contact',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          subject: formData.subject || 'General Inquiry',
          body: formData.message,
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
      <div className={styles.successBox}>
        <h3 className={styles.successHeading}>Thank you. We will reply soon.</h3>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          Your message has been delivered to the school administration office.
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
        placeholder="Enter your name"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <Field
          label="Phone Number"
          type="tel"
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
      </div>

      <Field
        label="Subject / Topic"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        placeholder="Admissions, academic inquiry, general question"
      />

      <Field
        label="Message"
        as="textarea"
        required
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={4}
        placeholder="How can our school assist you?"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading}>
          Send Message
        </Button>
      </div>
    </form>
  );
}
