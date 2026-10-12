'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Email or password is incorrect.');
        return;
      }

      if (data.user?.mustChangePassword) {
        router.push('/app/account/password');
      } else {
        router.push(nextPath);
      }
      router.refresh();
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className={styles.errorAlert} role="alert">
          {errorMessage}
        </div>
      )}

      <Field
        label="Email Address"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="user@balodaya.edu.np"
        autoComplete="email"
      />

      <Field
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your account password"
        autoComplete="current-password"
      />

      <div>
        <Button variant="primary" type="submit" loading={loading} style={{ width: '100%' }}>
          Sign In
        </Button>
      </div>

      <div style={{ marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--line)' }}>
        <p style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Demo Account (One-Click Fill)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {[
            { label: 'Administrator', email: 'admin@balodaya.edu.np', pass: 'AdminBalodaya2063!' },
            { label: 'Principal', email: 'principal@balodaya.edu.np', pass: 'Balodaya2063!' },
            { label: 'Teacher', email: 'bishnu.pokharel@balodaya.edu.np', pass: 'Balodaya2063!' },
            { label: 'Accountant', email: 'accountant@balodaya.edu.np', pass: 'Balodaya2063!' },
            { label: 'Parent', email: 'sita.sharma@balodaya.edu.np', pass: 'Balodaya2063!' },
            { label: 'Student', email: 'aarav.sharma@balodaya.edu.np', pass: 'Balodaya2063!' },
          ].map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.pass);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <strong style={{ fontSize: '11px', color: 'var(--ink)' }}>{acc.label}</strong>
              <span style={{ fontSize: '10px', color: 'var(--ink-soft)', wordBreak: 'break-all' }}>{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
