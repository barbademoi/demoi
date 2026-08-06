export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Tokens atuais do bm-theme (app/globals.css) + primary do tailwind.config.
export const COR = {
  fundo: '#0B0A08',
  texto: '#F4EFE7',
  suave: '#C4BDB0',
  primary: '#2563EB',
  ouro: '#FFD700',
  verde: '#34D399',
  vermelho: '#F87171',
  borda: 'rgba(244,239,231,0.12)',
}

export const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export const mesAno = (mes: number | null, ano: number | null) =>
  !mes || !ano ? '—' : `${MESES[mes - 1]}/${ano}`
