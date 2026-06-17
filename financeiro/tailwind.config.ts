import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta do módulo Financeiro (dark + dourado), alinhada ao BarberMeta
        bg: '#08090D',
        surface: '#0F1117',
        'surface-2': '#161820',
        ink: '#EEF0F6',
        'ink-soft': '#C4CDD4',
        faint: '#8B96A0',
        line: '#1E2028',
        primary: '#D2AE62',
        'primary-ink': '#0F1117',
        entrada: '#4ADE80',
        saida: '#F87171',
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
