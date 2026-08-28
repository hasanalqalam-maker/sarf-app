'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function NavWrapper() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return (
    <>
      <Sidebar />
      <BottomNav />
    </>
  );
}
