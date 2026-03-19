'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { type Locale, localeNames, getT } from './translations';

const STEPS_URL = '/steps.png';

const LOCALE_KEY = 'photoism-locale';
const LOCALES: Locale[] = ['en', 'zh', 'hi', 'vi', 'es', 'kr'];

const PHOTOISM_INSTAGRAM = 'https://www.instagram.com/photoism.global/';

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const s = localStorage.getItem(LOCALE_KEY);
  return (LOCALES.includes(s as Locale) ? s : 'en') as Locale;
}

export default function LocationPage() {
  const { slug } = useParams();
  const [locale, setLocale] = useState<Locale>('en');
  const [form, setForm] = useState({ name: '', pronouns: '' });
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [imageOverlay, setImageOverlay] = useState<boolean>(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deferLoading, setDeferLoading] = useState(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  const setLocaleAndStore = (l: Locale) => {
    setLocale(l);
    localStorage.setItem(LOCALE_KEY, l);
  };

  const t = getT(locale);
  const locationName = slug ? `Kpop Nara ${slug.toString().toUpperCase()}` : 'Kpop Nara';

  const LangSelector = () => (
    <div className="flex flex-wrap justify-center gap-1.5 mb-3 sm:mb-4">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocaleAndStore(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${locale === l ? 'bg-[var(--photoism-black)] text-white' : 'bg-white text-[var(--muted)] border border-[var(--card-border)] hover:border-[var(--photoism-black)]'}`}
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );

  const handleJoin = async () => {
    setLoading(true);
    const res = await fetch(`/api/locations/${slug}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setJoined(true);
      localStorage.setItem('queueId', data.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!joined) return;
    const poll = async () => {
      const id = localStorage.getItem('queueId');
      if (!id) return;
      const res = await fetch(`/api/locations/${slug}/status?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [joined, slug]);

  // Detect session end: show in-app message + browser notification (once)
  useEffect(() => {
    if (!status || !('Notification' in window)) return;
    const wasActive = status.status === 'active' && status.countdown != null;
    const nowDone = status.status === 'done' || (wasActive && status.countdown !== null && status.countdown <= 0);

    if (nowDone && !notifiedRef.current) {
      notifiedRef.current = true;
      setSessionEnded(true);
      if (Notification.permission === 'granted') {
        new Notification('Photoism session ended', { body: "Your time's up! Thank you for using Photoism at Kpop Nara." });
      }
    }
  }, [status]);

  // Request notification permission when session becomes active
  useEffect(() => {
    if (status?.status === 'active' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [status?.status]);

  if (joined && status) {
    const isActive = status.status === 'active' && status.countdown != null && status.countdown > 0;
    const isNotified = status.status === 'notified';
    const isWaiting = status.status === 'waiting';
    const isSkipped = status.status === 'no_show';
    const isCancelled = status.status === 'cancelled';
    const isFirstNoActive = status.isFirstInLineNoActiveSession === true;
    const showSteps = isActive || isNotified || isWaiting;
    const mins = isActive ? Math.floor(status.countdown / 60) : 0;
    const secs = isActive ? status.countdown % 60 : 0;

    const handleRejoin = () => {
      if (typeof window !== 'undefined') localStorage.removeItem('queueId');
      setJoined(false);
      setStatus(null);
    };

    const handleLeaveQueue = async () => {
      const id = typeof window !== 'undefined' ? localStorage.getItem('queueId') : null;
      const loc = Array.isArray(slug) ? slug[0] : slug;
      if (!id || !loc) return;
      setLeaveLoading(true);
      try {
        const res = await fetch(`/api/locations/${loc}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          setStatus((s: any) => (s ? { ...s, status: 'cancelled' } : s));
        }
      } finally {
        setLeaveLoading(false);
      }
    };

    const handleDeferTurn = async () => {
      const id = typeof window !== 'undefined' ? localStorage.getItem('queueId') : null;
      const loc = Array.isArray(slug) ? slug[0] : slug;
      if (!id || !loc) return;
      setDeferLoading(true);
      try {
        const res = await fetch(`/api/locations/${loc}/defer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          const statusRes = await fetch(`/api/locations/${loc}/status?id=${id}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            setStatus(data);
          }
        }
      } finally {
        setDeferLoading(false);
      }
    };

    const showGraceNotice = !isSkipped && !isCancelled && !isActive;
    const showQueueOptions = (isWaiting || isNotified || isFirstNoActive) && !isActive;

    // In-page image widget (steps) with close button
    const ImageOverlay = () => {
      if (!imageOverlay) return null;
      const title = t('howToUsePhotoism');
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setImageOverlay(false)}
          role="dialog"
          aria-label={title}
        >
          <div
            className="relative bg-white rounded-md shadow-xl max-w-sm w-full overflow-hidden flex flex-col border border-[var(--card-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--card-border)] shrink-0">
              <span className="font-semibold text-[var(--foreground)] text-sm">{title}</span>
              <button
                type="button"
                onClick={() => setImageOverlay(false)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-[var(--muted)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)] transition-colors"
                aria-label={t('close')}
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STEPS_URL} alt={title} className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg" />
              <a
                href={PHOTOISM_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--kpop-purple)] hover:underline"
              >
                {t('seeAllFrames')}
              </a>
            </div>
          </div>
        </div>
      );
    };

    if (sessionEnded || status.status === 'done') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-pb bg-[var(--background)]">
          <div className="bg-white border border-[var(--card-border)] rounded-md p-6 sm:p-8 shadow-[var(--shadow)] text-center max-w-md w-full mx-auto">
            <LangSelector />
            <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={56} height={56} className="mx-auto mb-4 sm:mb-6" />
            <p className="text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-2">Photoism</p>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--kpop-purple)] mb-4">{locationName}</h1>
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] mb-4">
              <span className="text-3xl sm:text-4xl">✓</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">{t('sessionEnded')}</p>
            <p className="text-[var(--muted)] text-sm sm:text-base">{t('thankYou')}</p>
          </div>
        </div>
      );
    }

    if (isSkipped) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-pb bg-[var(--background)]">
          <div className="bg-white border border-[var(--card-border)] rounded-md p-6 sm:p-8 shadow-[var(--shadow)] text-center max-w-md w-full mx-auto">
            <LangSelector />
            <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={56} height={56} className="mx-auto mb-4 sm:mb-6" />
            <p className="text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-2">Photoism</p>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--kpop-purple)] mb-4">{locationName}</h1>
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--warning)] text-[var(--warning)] mb-4">
              <span className="text-3xl sm:text-4xl">↻</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">{t('youWereSkipped')}</p>
            <p className="text-[var(--muted)] text-sm sm:text-base mb-6">{t('skippedMessage')}</p>
            <button
              type="button"
              onClick={handleDeferTurn}
              disabled={deferLoading}
              className="w-full min-h-[48px] bg-[var(--photoism-black)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-md transition-opacity"
            >
              {deferLoading ? '…' : t('deferTurn')}
            </button>
          </div>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-pb bg-[var(--background)]">
          <div className="bg-white border border-[var(--card-border)] rounded-md p-6 sm:p-8 shadow-[var(--shadow)] text-center max-w-md w-full mx-auto">
            <LangSelector />
            <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={56} height={56} className="mx-auto mb-4 sm:mb-6" />
            <p className="text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-2">Photoism</p>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--kpop-purple)] mb-4">{locationName}</h1>
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--muted)] text-[var(--muted)] mb-4">
              <span className="text-3xl sm:text-4xl">—</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">{t('youLeftQueue')}</p>
            <p className="text-[var(--muted)] text-sm sm:text-base mb-6">{t('leftQueueMessage')}</p>
            <button
              type="button"
              onClick={handleRejoin}
              className="w-full min-h-[48px] bg-[var(--photoism-black)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-md transition-opacity"
            >
              {t('rejoinNewSpot')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <ImageOverlay />
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-pb bg-[var(--background)]">
          <div className="bg-white border border-[var(--card-border)] rounded-md p-5 sm:p-8 shadow-[var(--shadow)] text-center max-w-md w-full mx-auto">
            <LangSelector />
            <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={56} height={56} className="mx-auto mb-2 sm:mb-4" />
            <p className="text-xs sm:text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-1">Photoism</p>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--kpop-purple)] mb-4 sm:mb-6">{locationName}</h1>

            {showGraceNotice && (
              <p className="text-left text-xs sm:text-sm text-[var(--foreground)] bg-amber-50 border border-amber-200/80 rounded-md p-3 mb-4 sm:mb-5 leading-relaxed">
                {t('gracePeriodNotice')}
              </p>
            )}

            {isActive ? (
              <>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--kpop-purple)] mb-2">
                  {t('currentStatus')}: {t('statusBooth')}
                </p>
                <p className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">{t('sessionActive')}</p>
                <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[var(--photoism-black)] text-2xl sm:text-3xl font-bold text-[var(--photoism-black)] mb-4 sm:mb-6 tabular-nums">
                  {mins}:{secs.toString().padStart(2, '0')}
                </div>
                <p className="text-[var(--muted)] text-sm mb-4">{t('headToBooth')}</p>
                {showSteps && (
                  <button
                    type="button"
                    onClick={() => setImageOverlay(true)}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] font-semibold text-sm sm:text-base hover:bg-[var(--photoism-black)] hover:text-white transition-colors"
                  >
                    {t('howToUsePhotoism')}
                  </button>
                )}
              </>
            ) : isNotified ? (
              <>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--photoism-black)] mb-2">
                  {t('currentStatus')}: {t('statusLine')}
                </p>
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] mb-4">
                  <span className="text-3xl sm:text-4xl font-bold">✓</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-[var(--photoism-black)] mb-2">{t('youreNext')}</p>
                <p className="text-[var(--foreground)] font-semibold text-sm sm:text-base">{t('returnToBooth')}</p>
                <p className="text-[var(--muted)] text-xs sm:text-sm mt-2 mb-4">{t('staffWillStart')}</p>
                {showSteps && (
                  <button
                    type="button"
                    onClick={() => setImageOverlay(true)}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] font-semibold text-sm sm:text-base hover:bg-[var(--photoism-black)] hover:text-white transition-colors"
                  >
                    {t('howToUsePhotoism')}
                  </button>
                )}
              </>
            ) : isFirstNoActive ? (
              <>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--photoism-black)] mb-2">
                  {t('currentStatus')}: {t('statusLine')}
                </p>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] text-3xl sm:text-4xl font-bold mb-4">
                  #{status.position}
                </div>
                <p className="text-lg sm:text-xl font-bold text-[var(--photoism-black)] mb-2">{t('youreNext')}</p>
                <p className="text-[var(--foreground)] font-semibold text-sm sm:text-base mb-4">{t('showStaffToStart')}</p>
                {showSteps && (
                  <button
                    type="button"
                    onClick={() => setImageOverlay(true)}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] font-semibold text-sm sm:text-base hover:bg-[var(--photoism-black)] hover:text-white transition-colors"
                  >
                    {t('howToUsePhotoism')}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] text-3xl sm:text-4xl font-bold mb-4">
                  #{status.position}
                </div>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-1">{t('inLine')}</p>
                <p className="text-[var(--muted)] text-sm sm:text-base mb-4">
                  {t('estimatedWait')}: ~
                  {typeof status.estimatedWaitMinutes === 'number' ? status.estimatedWaitMinutes : Math.max(0, (status.position ?? 1) - 1) * 10}{' '}
                  {t('min')}
                </p>
                <p className="text-xs sm:text-sm text-[var(--muted)] mb-4">{t('keepPageOpen')}</p>
                {showSteps && (
                  <button
                    type="button"
                    onClick={() => setImageOverlay(true)}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] font-semibold text-sm sm:text-base hover:bg-[var(--photoism-black)] hover:text-white transition-colors"
                  >
                    {t('howToUsePhotoism')}
                  </button>
                )}
              </>
            )}

            {showQueueOptions && (
              <div className="mt-6 pt-6 border-t border-[var(--card-border)] text-left">
                <p className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('queueOptionsIntro')}</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLeaveQueue}
                    disabled={leaveLoading}
                    className="w-full min-h-[44px] rounded-md border-2 border-[var(--danger)] text-[var(--danger)] font-semibold text-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    {leaveLoading ? '…' : t('removeFromQueue')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeferTurn}
                    disabled={deferLoading}
                    className="w-full min-h-[44px] rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] font-semibold text-sm hover:bg-[var(--photoism-black)] hover:text-white disabled:opacity-60 transition-colors"
                  >
                    {deferLoading ? '…' : t('deferTurn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-pb bg-[var(--background)]">
      <div className="bg-white border border-[var(--card-border)] rounded-md p-5 sm:p-8 shadow-[var(--shadow)] w-full max-w-md mx-auto">
        <LangSelector />
        <Image src="/kpopnara-logo.png" alt="Kpop Nara" width={56} height={56} className="mx-auto mb-2 sm:mb-4" />
        <p className="text-xs sm:text-sm font-semibold text-[var(--photoism-black)] uppercase tracking-wider mb-1 text-center">Photoism</p>
        <h1 className="text-xl sm:text-2xl font-bold text-center text-[var(--kpop-purple)] mb-4 sm:mb-6">{t('joinTitle')} {locationName}</h1>

        <input
          type="text"
          placeholder={t('yourName')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full min-h-[44px] p-3 mb-3 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors text-base"
          autoComplete="name"
          required
        />
        <input
          type="text"
          placeholder={t('pronounsOptional')}
          value={form.pronouns}
          onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
          className="w-full min-h-[44px] p-3 mb-6 border border-[var(--card-border)] rounded-md bg-white text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--photoism-black)] transition-colors text-base"
          autoComplete="off"
        />
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full min-h-[48px] bg-[var(--photoism-black)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-md transition-opacity text-base"
        >
          {loading ? t('joining') : t('joinQueue')}
        </button>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          <a href={PHOTOISM_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-[var(--kpop-purple)] font-semibold hover:underline">
            {t('seeAllFrames')}
          </a>
        </p>
      </div>
    </div>
  );
}
