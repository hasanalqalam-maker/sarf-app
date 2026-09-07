'use client';

import { usePathname } from 'next/navigation';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/reset-password';
  return (
    <main className={isAuthPage ? 'min-h-dvh' : 'lg:pl-60 min-h-dvh pb-16 lg:pb-0'}>
      {children}
    </main>
  );
}
