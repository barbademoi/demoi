import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,tsx}',
  ],
  safelist: [
    'bar-bronze', 'bar-silver', 'bar-gold',
    'metal-text-bronze', 'metal-text-silver', 'metal-text-gold',
  ],
  theme: {
    extend: {
      colors: {
        background: '#08090D',
        surface: '#0F1117',
        'surface-2': '#161820',
        border: '#1E2028',
        primary: '#2563EB',
        'primary-hover': '#1D4ED8',
        text: '#EEF0F6',
        'text-muted': '#8B8FA8',
        bronze: '#CD7F32',
        silver: '#A8A9AD',
        gold: '#FFD700',
      },
      fontFamily: {
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'bronze-metal': 'linear-gradient(135deg, #8B4513 0%, #CD7F32 30%, #E8A855 50%, #CD7F32 70%, #8B4513 100%)',
        'silver-metal': 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 30%, #D1D5DB 50%, #9CA3AF 70%, #6B7280 100%)',
        'gold-metal': 'linear-gradient(135deg, #92400E 0%, #D97706 25%, #FFD700 50%, #D97706 75%, #92400E 100%)',
      },
      boxShadow: {
        bronze: '0 0 12px 2px rgba(205, 127, 50, 0.45)',
        silver: '0 0 12px 2px rgba(168, 169, 173, 0.45)',
        gold: '0 0 16px 4px rgba(255, 215, 0, 0.55)',
        'primary-glow': '0 0 20px rgba(37, 99, 235, 0.4)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
