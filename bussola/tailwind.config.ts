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
        // Azul-petróleo — cor primária (provisória)
        primary: '#1F3A52',
        'primary-hover': '#172C3E',
        'primary-soft': '#E7EDF2',
        background: '#F7F8FA',
        surface: '#FFFFFF',
        border: '#E2E6EC',
        text: '#1A2330',
        'text-muted': '#5C6675',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
