import type { Config } from 'tailwindcss';

/**
 * Design tokens — "Elegant Barbershop, Black & White".
 * Monochrome ink/cream palette with a single restrained brass accent.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          950: '#050505',
          900: '#0d0d0d',
          800: '#141414',
          700: '#1c1c1c',
          600: '#262626'
        },
        cream: {
          DEFAULT: '#f5f3ef',
          dark: '#eae6de',
          deep: '#ddd7cb'
        },
        smoke: {
          DEFAULT: '#8a8781',
          light: '#b5b1a8',
          dark: '#55534e'
        },
        brass: {
          DEFAULT: '#c9a86a',
          light: '#ddc394',
          dark: '#a8874b'
        }
      },
      fontFamily: {
        display: ['var(--font-heading)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        luxe: '0.32em'
      },
      maxWidth: {
        content: '72rem'
      },
      transitionTimingFunction: {
        elegant: 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(26px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slow-drift': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slow-drift': 'slow-drift 2.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
