'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  const allowed = profile?.role === 'teacher';

  useEffect(() => {
    if (!isLoading && profile && !allowed) router.replace('/');
  }, [isLoading, profile, allowed, router]);

  if (isLoading || !profile) {
    return <div className="px-4 py-8 text-sm font-sans text-ink-muted">Loading…</div>;
  }
  if (!allowed) {
    return (
      <div className="px-4 py-8 text-sm font-sans text-ink-muted">
        This area is for teacher accounts.
      </div>
    );
  }
  return <>{children}</>;
}
