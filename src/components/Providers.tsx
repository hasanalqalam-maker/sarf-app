'use client';

import { ProgressProvider } from '@/lib/progressContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
