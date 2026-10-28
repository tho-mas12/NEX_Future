/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
          border: '#e2e8f0',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
          hover: '#1d4ed8',
        },
        accent: {
          DEFAULT: '#f97316',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        border: '#e2e8f0',
        input: '#ffffff',
        ring: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
