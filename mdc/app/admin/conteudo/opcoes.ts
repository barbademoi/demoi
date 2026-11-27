export const NIVEIS = [1, 2, 3].map((n) => ({ valor: String(n), rotulo: `Nível ${n}` }))
export const SEMANAS_CICLO = Array.from({ length: 13 }, (_, i) => ({ valor: String(i + 1), rotulo: `Semana ${i + 1}` }))
export const PERFIS_MISSAO = [
  { valor: 'ambos', rotulo: 'Ambos' },
  { valor: 'sozinho', rotulo: 'Sozinho na cadeira' },
  { valor: 'equipe', rotulo: 'Com equipe' },
]
export const TIPOS_MISSAO = [
  { valor: 'habito_diario', rotulo: 'Hábito diário (acumula nas semanas seguintes)' },
  { valor: 'missao_semana', rotulo: 'Missão da semana (implantação)' },
]
