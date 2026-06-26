'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/exercises',
    label: 'Exercises',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/reference',
    label: 'Reference',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h5" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-parchment-darker">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-parchment-darker">
        <p
          className="arabic text-[1.75rem] font-bold text-gold leading-none"
          dir="rtl"
        >
          الصَّرْفُ
        </p>
        <p className="text-ink-muted text-[11px] mt-2 font-sans tracking-wide">
          Sarf App · Al-Qalam Institute
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans font-medium
                    transition-colors duration-150 border-l-2
                    ${isActive
                      ? 'bg-gold/10 text-gold border-gold'
                      : 'text-ink-muted hover:text-ink hover:bg-parchment-dark border-transparent'
                    }
                  `}
                >
                  <span className={isActive ? 'text-gold' : 'text-ink-muted'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-parchment-darker">
        <p className="text-ink-muted text-[11px] font-sans">
          FSTU Sarf 2023 · Units 1–2
        </p>
      </div>
    </aside>
  );
}
