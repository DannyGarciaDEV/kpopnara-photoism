'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type DisplayData = {
  locationName: string;
  activeSession: { name: string; countdown: number } | null;
  nextUp: { name: string; position: number } | null;
  queue: { position: number; name: string; status: string }[];
};

export default function QueueDisplayPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchDisplay = async () => {
      const res = await fetch(`/api/locations/${slug}/display`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setError(null);
      } else {
        setError('Could not load queue');
      }
    };
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 3000);
    return () => clearInterval(interval);
  }, [slug]);

  if (error || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
        <p className="text-xl font-semibold text-[var(--muted)]">{error || 'Invalid location'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-xl font-semibold text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  const { locationName, activeSession, nextUp, queue } = data;
  const mins = activeSession ? Math.floor(activeSession.countdown / 60) : 0;
  const secs = activeSession ? activeSession.countdown % 60 : 0;

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6 md:p-8 flex flex-col">
      <header className="flex items-center gap-3 mb-6 sm:mb-8">
        <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={48} height={48} className="sm:w-14 sm:h-14 shrink-0" />
        <div>
          <p className="text-xs sm:text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider">Photoism Queue</p>
          <h1 className="text-xl sm:text-3xl font-bold text-[var(--kpop-purple)]">{locationName}</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 flex-1">
        {/* Left: Now & Next */}
        <div className="space-y-6">
          <section className="bg-white border-2 border-[var(--card-border)] rounded-xl p-6 sm:p-8 shadow-[var(--shadow)]">
            <h2 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Now in the booth</h2>
            {activeSession ? (
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-[var(--photoism-black)] mb-2">{activeSession.name}</p>
                <div className="inline-flex items-center justify-center min-w-[140px] py-3 px-6 rounded-lg border-2 border-[var(--photoism-black)] text-3xl sm:text-4xl font-bold text-[var(--photoism-black)] tabular-nums">
                  {mins}:{secs.toString().padStart(2, '0')}
                </div>
              </div>
            ) : (
              <p className="text-xl sm:text-2xl font-semibold text-[var(--muted)]">No one in booth</p>
            )}
          </section>

          <section className="bg-white border-2 border-[var(--card-border)] rounded-xl p-6 sm:p-8 shadow-[var(--shadow)]">
            <h2 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Next up</h2>
            {nextUp ? (
              <p className="text-2xl sm:text-4xl font-bold text-[var(--kpop-purple)]">
                #{nextUp.position} — {nextUp.name}
              </p>
            ) : (
              <p className="text-xl sm:text-2xl font-semibold text-[var(--muted)]">Queue is empty</p>
            )}
          </section>
        </div>

        {/* Right: Full queue order */}
        <section className="bg-white border-2 border-[var(--card-border)] rounded-xl p-6 sm:p-8 shadow-[var(--shadow)]">
          <h2 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Queue order</h2>
          {queue.length === 0 ? (
            <p className="text-lg font-semibold text-[var(--muted)] py-8">No one in line</p>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {queue.map((entry) => (
                <li
                  key={`${entry.position}-${entry.name}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
                >
                  <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--kpop-purple-soft)] text-[var(--kpop-purple)] font-bold text-lg sm:text-xl tabular-nums shrink-0">
                    #{entry.position}
                  </span>
                  <span className="font-semibold text-[var(--foreground)] text-lg sm:text-xl truncate">{entry.name}</span>
                  {entry.status === 'active' && (
                    <span className="ml-auto text-xs font-semibold text-[var(--kpop-purple)] uppercase">Now</span>
                  )}
                  {entry.status === 'notified' && (
                    <span className="ml-auto text-xs font-semibold text-[var(--photoism-black)] uppercase">Next</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
