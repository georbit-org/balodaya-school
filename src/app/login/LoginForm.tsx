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
    </form>
  );
}
