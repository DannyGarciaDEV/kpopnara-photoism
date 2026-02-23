'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function StaffLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        localStorage.setItem('staffToken', data.token);
        // Short delay so storage is committed before navigation
        setTimeout(() => {
          window.location.replace('/staff/dashboard');
        }, 50);
        return;
      }
      alert(data.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pb-safe bg-[var(--background)]">
      <div className="bg-white border border-[var(--card-border)] rounded-md p-5 sm:p-8 shadow-[var(--shadow)] w-full max-w-md mx-auto">
        <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={64} height={64} className="mx-auto mb-2" />
        <p className="text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-1 text-center">Staff only</p>
        <h1 className="text-2xl font-bold text-center text-[var(--kpop-purple)] mb-6">Kpop Nara Staff Login</h1>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full min-h-[44px] p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors text-base"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full min-h-[44px] p-3 mb-6 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors text-base"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-[var(--photoism-black)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-md transition-opacity text-base"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{' '}
          <a href="/staff/signup" className="font-semibold text-[var(--kpop-purple)] hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
