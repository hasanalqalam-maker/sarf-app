import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#F7F2EA',
          dark: '#EDE8DC',
          darker: '#E0D9CC',
        },
        ink: {
          DEFAULT: '#052547',  // book cover navy
          light: '#07325f',    // book body-text navy
          muted: '#4a6a8a',    // muted steel blue
        },
        gold: {
          DEFAULT: '#0e60ba',  // book grammar-heading blue
          light: '#1a81ee',    // lighter blue
          muted: '#07325f',    // dark navy-blue
        },
        teal: {
          DEFAULT: '#4e8542',  // book institution green
          light: '#7c9163',    // book olive green
          dark: '#2d5a25',     // deeper green
        },
        crimson: {
          DEFAULT: '#a30000',  // book unit-banner red (dominant colour)
          light: '#c00000',    // slightly lighter red
          dark: '#7a0000',     // deeper red
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        arabic: ['var(--font-arabic)', '"Scheherazade New"', '"Noto Naskh Arabic"', 'serif'],
      },
      fontSize: {
        'arabic-lg': ['1.5rem', { lineHeight: '2.5rem' }],
        'arabic-xl': ['2rem', { lineHeight: '3rem' }],
        'arabic-2xl': ['2.5rem', { lineHeight: '3.5rem' }],
      },
    },
  },
  plugins: [],
};

export default config;
