'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ALLOWED_LOCATIONS: Record<string, string> = {
  nyc: 'Kpop Nara NYC',
  boston: 'Kpop Nara Boston',
};

export default function StaffLocationSignup() {
  const params = useParams();
  const locationSlug = typeof params?.location === 'string' ? params.location.toLowerCase() : '';
  const locationName = ALLOWED_LOCATIONS[locationSlug];

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (locationSlug && !locationName) {
      setError('Invalid location');
    } else {
      setError('');
    }
  }, [locationSlug, locationName]);

  const handleSignup = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    if (!locationName) {
      setError('Invalid location');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
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
          location_id: locationSlug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setForm({ email: '', password: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!locationSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="bg-white border border-[var(--card-border)] rounded-md p-8 shadow-[var(--shadow)] w-full max-w-md text-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!locationName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="bg-white border border-[var(--card-border)] rounded-md p-8 shadow-[var(--shadow)] w-full max-w-md text-center">
          <p className="text-red-600 font-semibold mb-4">Location not found</p>
          <Link href="/staff/login" className="text-[var(--kpop-purple)] font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-center text-[var(--kpop-purple)] mb-1">Create your account</h1>
        <p className="text-center text-sm text-[var(--muted)] mb-6">{locationName}</p>

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
