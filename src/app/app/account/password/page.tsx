'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function AccountPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update password.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/app/dashboard');
        router.refresh();
      }, 1500);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', margin: '0 0 var(--sp-2) 0' }}>
          Change Password
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
          Update your login password to secure your account. Minimum 8 characters.
        </p>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 'var(--sp-6)' }}>
        {success ? (
          <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-wash)', padding: 'var(--sp-4)', borderRadius: 'var(--radius)' }}>
            <strong>Password changed successfully!</strong> Redirecting to dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {error && (
              <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-wash)', padding: 'var(--sp-3)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' }}>
                {error}
              </div>
            )}

            <Field
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
            />

            <Field
              label="New Password (min 8 characters)"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
            />

            <Field
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />

            <div style={{ marginTop: 'var(--sp-2)' }}>
              <Button variant="primary" type="submit" loading={loading}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
