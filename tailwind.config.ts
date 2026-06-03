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
          DEFAULT: '#1A1208',
          light: '#3D2E14',
          muted: '#6B5B3E',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4A017',
          muted: '#8B6508',
        },
        teal: {
          DEFAULT: '#1B6B5A',
          light: '#2A9077',
          dark: '#134E42',
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
