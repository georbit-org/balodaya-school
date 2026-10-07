'use client';

import React, { useState } from 'react';

interface ApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationDrawer({ isOpen, onClose }: ApplicationDrawerProps) {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    gradeApplying: 'Grade 1',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.application) {
        setSubmittedReceipt(data.application.id);
      } else {
        setErrorMessage(data.error || 'Failed to submit application.');
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReceipt(null);
    setFormData({
      studentName: '',
      parentName: '',
      phone: '',
      email: '',
      gradeApplying: 'Grade 1',
      notes: '',
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        zIndex: 250,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: 'var(--paper)',
          borderLeft: '2px solid var(--rule-strong)',
          padding: 'var(--s-8)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-overlay)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: '1px solid var(--rule)',
              paddingBottom: 'var(--s-4)',
              marginBottom: 'var(--s-6)',
            }}
          >
            <div>
              <div className="meta-label" style={{ color: 'var(--dawn-ink)', marginBottom: '2px' }}>
                Electronic Enrolment Portal · 2083/84
              </div>
              <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--ink)' }}>
                Admissions Application Desk
              </h3>
            </div>
            <button
              onClick={onClose}
              className="badge-neutral"
              style={{
                fontSize: '0.84rem',
                padding: '4px 14px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          {submittedReceipt ? (
            /* Submission Confirmation Receipt */
            <div
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--s-8)',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 'var(--s-3)' }}>
                <span className="badge badge-teal">Application Received</span>
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: 'var(--s-2)', color: 'var(--ink)' }}>
                Application Successfully Received
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', marginBottom: 'var(--s-6)' }}>
                Your electronic dossier has been logged into the admissions committee registry. Our administration will contact you to confirm registration verification.
              </p>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  padding: 'var(--s-3)',
                  backgroundColor: 'var(--paper)',
                  border: '1px dashed var(--rule-strong)',
                  marginBottom: 'var(--s-6)',
                  color: 'var(--ink)',
                }}
              >
                Tracking Receipt: <strong>{submittedReceipt}</strong>
              </div>

              <button onClick={handleReset} className="btn-primary" style={{ width: '100%', height: '2.8rem' }}>
                Done / Close Drawer
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
              {errorMessage && (
                <div
                  style={{
                    backgroundColor: 'oklch(96% 0.03 25)',
                    border: '1px solid oklch(65% 0.18 30)',
                    color: 'oklch(40% 0.16 30)',
                    padding: 'var(--s-3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sujata Aryal"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontFamily: 'var(--font-sans)',
                    border: '1px solid var(--rule-strong)',
                    backgroundColor: 'var(--paper)',
                  }}
                />
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                  Parent / Guardian Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mukesh Aryal"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontFamily: 'var(--font-sans)',
                    border: '1px solid var(--rule-strong)',
                    backgroundColor: 'var(--paper)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
                <div>
                  <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Primary Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--rule-strong)',
                      backgroundColor: 'var(--paper)',
                    }}
                  />
                </div>

                <div>
                  <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Grade Applying *
                  </label>
                  <select
                    value={formData.gradeApplying}
                    onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--rule-strong)',
                      backgroundColor: 'var(--paper)',
                    }}
                  >
                    <option value="Nursery">Nursery</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                  Electronic Mail (Optional)
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--rule-strong)',
                    backgroundColor: 'var(--paper)',
                  }}
                />
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '4px' }}>
                  Special Notes or Prior Academic Background
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding previous school, interests, or transportation needs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontFamily: 'var(--font-sans)',
                    border: '1px solid var(--rule-strong)',
                    backgroundColor: 'var(--paper)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', height: '3.2rem', marginTop: 'var(--s-3)' }}
              >
                {submitting ? 'Submitting Application...' : 'Submit Electronic Application'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Notice */}
        <div
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 'var(--s-4)',
            marginTop: 'var(--s-6)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--ink-3)',
            lineHeight: 1.5,
          }}
        >
          Balodaya Secondary English Boarding School · Sundar Bazar, Bheerkot-06, Syangja · Office Hours: Sun–Fri 09:30–16:30 NST.
        </div>
      </div>
    </div>
  );
}
