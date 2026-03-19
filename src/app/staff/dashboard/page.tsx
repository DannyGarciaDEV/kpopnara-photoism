'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('staffToken') : null;
    if (!token) {
      router.replace('/staff/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const locationId = payload?.location_id;
      const dashSlug = locationId === 'boston' ? 'bos' : 'nyc';
      router.replace(`/staff/dashboard/${dashSlug}`);
    } catch {
      router.replace('/staff/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-[var(--muted)] font-semibold">Redirecting...</div>
    </div>
  );
}
