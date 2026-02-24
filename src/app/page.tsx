import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 pb-safe bg-[var(--background)]">
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--kpop-purple)] mb-1">Kpop Nara</h1>
        <p className="text-base sm:text-lg font-semibold text-[var(--photoism-black)] mb-6 sm:mb-8">Photoism Queue</p>
        <p className="text-sm sm:text-base text-[var(--muted)] mb-6 sm:mb-8 px-2">
          Scan the QR code at your Kpop Nara location to join the Photoism queue, or use the links below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/locations/nyc"
            className="inline-flex items-center justify-center min-h-[48px] font-semibold py-3 px-6 rounded-md bg-[var(--photoism-black)] text-white hover:opacity-90 transition-opacity"
          >
            NYC queue
          </Link>
          <Link
            href="/locations/boston"
            className="inline-flex items-center justify-center min-h-[48px] font-semibold py-3 px-6 rounded-md border-2 border-[var(--photoism-black)] text-[var(--photoism-black)] hover:bg-[var(--photoism-black)] hover:text-white transition-colors"
          >
            Boston queue
          </Link>
        </div>
      </div>
    </div>
  );
}
