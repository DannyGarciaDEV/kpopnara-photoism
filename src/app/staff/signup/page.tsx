'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff/nyc/signup');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="text-[var(--muted)]">Redirecting to staff signup...</div>
    </div>
  );
}
