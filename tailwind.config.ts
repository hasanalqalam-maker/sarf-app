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
        // Surface / background colours
        parchment: {
          DEFAULT: '#FFFFFF',   // white (was warm cream #F7F2EA)
          dark: '#F8F9FA',      // light grey (was #EDE8DC)
          darker: '#E5E7EB',    // border grey (was #E0D9CC)
        },
        // Text colours
        ink: {
          DEFAULT: '#1A1A2E',   // near-black (was dark navy #052547)
          light: '#374151',     // dark grey (was #07325f)
          muted: '#6B7280',     // medium grey (was steel blue #4a6a8a)
        },
        // Primary — book grammar-heading blue
        gold: {
          DEFAULT: '#0e60ba',
          light: '#1a81ee',
          muted: '#07325f',
        },
        // Secondary — book institution green
        teal: {
          DEFAULT: '#4e8542',
          light: '#6ba35e',
          dark: '#2d5a25',
        },
        // Accent — book unit-banner red
        crimson: {
          DEFAULT: '#a30000',
          light: '#c00000',
          dark: '#7a0000',
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
