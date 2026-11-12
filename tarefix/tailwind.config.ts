import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--fonte)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tokens: valores em globals.css (claro/escuro)
        fundo: 'rgb(var(--fundo) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        texto: 'rgb(var(--texto) / <alpha-value>)',
        suave: 'rgb(var(--suave) / <alpha-value>)',
        borda: 'rgb(var(--borda) / <alpha-value>)',
        marca: {
          DEFAULT: '#5B3DF5',
          forte: '#4A2DE0',
          clara: 'rgb(var(--marca-clara) / <alpha-value>)',
        },
        // RESERVADAS ao termômetro — não usar em botões nem na marca.
        termo: { vermelho: '#E5484D', amarelo: '#F5A524', verde: '#2DB960' },
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
export default config
