import type { Config } from 'tailwindcss'

// Visual Demôi: carvão + latão. O latão é a cor de ação (botões, destaques);
// verde/vermelho só para estado (pago, vencido), nunca para marca.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fundo: '#0B0B0C',
        card: '#151517',
        'card-2': '#1C1C1F',
        linha: '#2A2A2E',
        texto: '#F3F1EC',
        suave: '#A6A39C',
        latao: '#D9A441',
        'latao-forte': '#E8B95A',
        ok: '#3FB970',
        alerta: '#F2B33D',
        perigo: '#E5484D',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
