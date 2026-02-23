'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function StaffSignup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    location_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.location_id) {
      setError('Please select your location (NYC or Boston)');
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/staff/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          location_id: form.location_id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setForm({ email: '', password: '', confirmPassword: '', location_id: '' });
      } else {
        setError(data.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="bg-white border border-[var(--card-border)] rounded-md p-8 shadow-[var(--shadow)] w-full max-w-md text-center">
          <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={64} height={64} className="mx-auto mb-4" />
          <p className="text-[var(--kpop-purple)] font-semibold mb-2">Account created</p>
          <p className="text-[var(--muted)] mb-6">You can now log in with your email and password.</p>
          <Link
            href="/staff/login"
            className="inline-block w-full bg-[var(--photoism-black)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-md transition-opacity text-center"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="bg-white border border-[var(--card-border)] rounded-md p-8 shadow-[var(--shadow)] w-full max-w-md">
        <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={64} height={64} className="mx-auto mb-2" />
        <p className="text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-1 text-center">Staff only</p>
        <h1 className="text-2xl font-bold text-center text-[var(--kpop-purple)] mb-6">Create your account</h1>

        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors"
            autoComplete="new-password"
            required
          />
          <select
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
            className="w-full p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] focus:border-[var(--photoism-black)] transition-colors"
            required
            aria-label="Location"
          >
            <option value="">Select your location</option>
            <option value="nyc">Kpop Nara NYC</option>
            <option value="boston">Kpop Nara Boston</option>
          </select>
          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--photoism-black)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-md transition-opacity"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link href="/staff/login" className="font-semibold text-[var(--kpop-purple)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
