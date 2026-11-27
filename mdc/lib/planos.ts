export type PlanoId = 'semestral_cartao' | 'semestral_pix' | 'mensal_pix'

export type Plano = {
  id: PlanoId
  nome: string
  curto: string
  valor: number
  forma: 'cartao' | 'pix'
  meses: number
  destaque: string
  detalhe: string
}

export const PLANOS: Plano[] = [
  {
    id: 'semestral_cartao',
    nome: 'Semestral no cartão',
    curto: 'Semestral cartão',
    valor: 997,
    forma: 'cartao',
    meses: 6,
    destaque: '6x de R$ 166,17',
    detalhe: 'R$ 997 em até 6x sem juros',
  },
  {
    id: 'semestral_pix',
    nome: 'Semestral no Pix',
    curto: 'Semestral Pix',
    valor: 897,
    forma: 'pix',
    meses: 6,
    destaque: 'R$ 897 à vista',
    detalhe: 'Economia de R$ 100 pagando no Pix',
  },
  {
    id: 'mensal_pix',
    nome: 'Mensal no Pix',
    curto: 'Mensal Pix',
    valor: 247,
    forma: 'pix',
    meses: 1,
    destaque: 'R$ 247 por mês',
    detalhe: 'Sem fidelidade',
  },
]

export function plano(id: string | null | undefined): Plano | undefined {
  return PLANOS.find((p) => p.id === id)
}

export function planoValido(id: unknown): id is PlanoId {
  return typeof id === 'string' && PLANOS.some((p) => p.id === id)
}
