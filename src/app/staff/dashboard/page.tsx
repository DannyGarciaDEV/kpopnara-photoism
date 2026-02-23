'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('staffToken');
    if (!token) {
      router.replace('/staff/login');
      return;
    }
    setError(null);
    const res = await fetch('/api/staff/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      setData(d);
    } else if (res.status === 401) {
      localStorage.removeItem('staffToken');
      router.replace('/staff/login');
    } else {
      setError('Couldn’t load dashboard. Check your connection and try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, entryId?: string) => {
    const token = localStorage.getItem('staffToken');
    const res = await fetch(`/api/staff/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entryId ? { queue_entry_id: entryId } : {}),
    });
    if (res.ok) {
      fetchData();
    }
  };

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-[var(--muted)] font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-[var(--danger)] font-semibold text-center">{error}</p>
        <button
          type="button"
          onClick={() => { setError(null); setLoading(true); fetchData(); }}
          className="bg-[var(--photoism-black)] text-white font-semibold py-2 px-4 rounded-md"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => { localStorage.removeItem('staffToken'); router.replace('/staff/login'); }}
          className="text-[var(--muted)] text-sm underline"
        >
          Log out
        </button>
      </div>
    );
  }

  const activeSession = data?.activeSession;
  const queue = data?.queue ?? [];
  const locationName = data?.location?.name ?? 'Kpop Nara';

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pb-safe bg-[var(--background)]">
      <header className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={40} height={40} className="sm:w-12 sm:h-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider">Staff</p>
          <h1 className="text-xl sm:text-3xl font-bold text-[var(--kpop-purple)] truncate">{locationName} Dashboard</h1>
        </div>
      </header>

      {/* Active Session */}
      <section className="bg-white border border-[var(--card-border)] rounded-md p-4 sm:p-6 shadow-[var(--shadow)] mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-3 sm:mb-4">Active session</h2>
        {activeSession ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-bold text-[var(--foreground)]">{activeSession.name}</p>
              {activeSession.pronouns && (
                <p className="text-sm text-[var(--muted)]">{activeSession.pronouns}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center min-w-[100px] py-2 px-4 rounded-md border-2 border-[var(--photoism-black)] text-xl font-bold text-[var(--photoism-black)] tabular-nums">
                {Math.floor(activeSession.countdown / 60)}:{(activeSession.countdown % 60).toString().padStart(2, '0')}
              </div>
              <button
                onClick={() => handleAction('end-session')}
                className="min-h-[44px] bg-[var(--danger)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-md transition-opacity"
              >
                End session
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[var(--muted)]">No active session</p>
        )}
      </section>

      {/* Queue */}
      <section className="bg-white border border-[var(--card-border)] rounded-md p-4 sm:p-6 shadow-[var(--shadow)]">
        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-3 sm:mb-4">Queue</h2>
        <ul className="space-y-2">
          {queue.length === 0 ? (
            <li className="text-[var(--muted)] py-4">Queue is empty</li>
          ) : (
            queue.map((entry: any) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 border border-[var(--card-border)] rounded-md bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--kpop-purple-soft)] text-[var(--kpop-purple)] font-semibold text-sm">
                    #{entry.position}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{entry.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {entry.pronouns ? `${entry.pronouns} · ` : ''}
                      {entry.phone && entry.phone !== '****' ? `${entry.phone} · ` : ''}
                      <span className="capitalize">{entry.status.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!activeSession && queue[0]?.id === entry.id && (
                    <button
                      onClick={() => handleAction('start-session', entry.id)}
                      className="min-h-[44px] bg-[var(--photoism-black)] hover:opacity-90 text-white font-semibold py-2 px-3 sm:px-4 rounded-md transition-opacity text-sm sm:text-base"
                    >
                      Start session
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('skip', entry.id)}
                    className="min-h-[44px] bg-[var(--warning)] hover:opacity-90 text-white font-semibold py-2 px-3 sm:px-4 rounded-md transition-opacity text-sm sm:text-base"
                  >
                    Skip
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
