/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'thrift-primary': '#2D6A4F',
        'thrift-secondary': '#F4A261',
        'thrift-bg': '#FAFAF7',
        'thrift-surface': '#FFFFFF',
        'thrift-text': '#1A1A1A',
        'thrift-text-secondary': '#6B7280',
        'thrift-border': '#E5E7EB',
        'thrift-success': '#10B981',
        'thrift-error': '#EF4444',
        'thrift-warning': '#F59E0B',
        'thrift-admin': '#1B4332',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'input': '6px',
      },
      boxShadow: {
        'micro': '0 1px 3px rgba(0,0,0,0.08)',
        'lift': '0 4px 12px rgba(0,0,0,0.12)',
        'card': '0 2px 8px rgba(0,0,0,0.06)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
      },
    },
  },
  plugins: [],
};
