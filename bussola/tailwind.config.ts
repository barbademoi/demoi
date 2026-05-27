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
        // Tokens semânticos — agora na paleta marrom/bege
        primary: '#8B6F47',
        'primary-hover': '#5C4A30',
        'primary-soft': '#EBE5DA',
        background: '#F5F1EA',
        surface: '#FFFFFF',
        border: '#E5DDD0',
        text: '#0F0F0F',
        'text-muted': '#4A4A4A',

        // Neutros nomeados
        preto: '#0F0F0F',
        carvao: '#1F1F1F',
        grafite: '#4A4A4A',
        chumbo: '#8A8A8A',
        areia: '#F5F1EA',
        linho: '#EBE5DA',
        borda: '#E5DDD0',

        // Marca
        marrom: '#8B6F47',
        'marrom-escuro': '#5C4A30',
        'marrom-claro': '#A88B62',

        // Funcionais
        'verde-musgo': '#5C7148',
        ambar: '#A56336',
        vinho: '#8B2E2E',
        'azul-noite': '#2D3E50',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        suave: '0 1px 3px rgba(0,0,0,0.04)',
        media: '0 4px 12px rgba(0,0,0,0.06)',
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
