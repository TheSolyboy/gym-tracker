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
        gym: {
          bg: '#0a0a0a',
          card: '#111111',
          border: '#222222',
          accent: '#e11d48',
          'accent-hover': '#be123c',
          muted: '#6b7280',
          text: '#f3f4f6',
          'text-muted': '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};

export default config;
