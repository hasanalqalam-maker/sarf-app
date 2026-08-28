import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display, Scheherazade_New } from 'next/font/google';
import './globals.css';
import NavWrapper from '@/components/layout/NavWrapper';
import MainWrapper from '@/components/layout/MainWrapper';
import Providers from '@/components/Providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const scheherazade = Scheherazade_New({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sarf App — Al-Qalam Institute',
  description: 'Interactive Arabic Sarf (morphology) learning based on FSTU Sarf 2023',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${scheherazade.variable}`}>
      <body className="bg-parchment-dark text-ink font-sans">
        <Providers>
          <NavWrapper />
          <MainWrapper>{children}</MainWrapper>
        </Providers>
      </body>
    </html>
  );
}
