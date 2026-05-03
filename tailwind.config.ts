import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FDF8F0',
          card: '#FFFFFF',
          subtle: '#F5EDE0',
        },
        foreground: {
          DEFAULT: '#2D2A26',
          muted: '#6B6259',
          subtle: '#A8A096',
        },
        primary: {
          50:  '#F0F8F4',
          100: '#D5EDDF',
          200: '#A8D5BA',
          300: '#7FBF9E',
          400: '#5FA982',
          500: '#4A8E6A',
          DEFAULT: '#7FBF9E',
          foreground: '#FFFFFF',
        },
        coral: {
          200: '#FFB89A',
          300: '#FF9A75',
          DEFAULT: '#FFB89A',
        },
        sky: {
          200: '#A8C8E8',
          300: '#7FB0DC',
          DEFAULT: '#A8C8E8',
        },
        lavender: {
          200: '#C8B6E2',
          300: '#A88FD1',
          DEFAULT: '#C8B6E2',
        },
        sun: {
          200: '#FFD89A',
          300: '#FFC470',
          DEFAULT: '#FFD89A',
        },
        // shadcn/ui 호환
        border: '#F5EDE0',
        input: '#F5EDE0',
        ring: '#7FBF9E',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2D2A26',
        },
        secondary: {
          DEFAULT: '#F5EDE0',
          foreground: '#2D2A26',
        },
        muted: {
          DEFAULT: '#F5EDE0',
          foreground: '#6B6259',
        },
        accent: {
          DEFAULT: '#F5EDE0',
          foreground: '#2D2A26',
        },
        destructive: {
          DEFAULT: '#FF9A75',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#2D2A26',
        },
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(45, 42, 38, 0.04)',
        card: '0 4px 16px rgba(45, 42, 38, 0.06)',
        hover: '0 8px 24px rgba(45, 42, 38, 0.10)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
