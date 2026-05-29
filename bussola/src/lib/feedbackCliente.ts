// Helpers do Prompt G — sorteio ponderado, gerador de slug/código de resgate,
// validação. Sem dependências externas.

export interface BrindeLite {
  id: string
  nome: string
  descricao: string | null
  peso: number
}

// Slug do link público da empresa (/c/[slug]). 12 chars alfanuméricos
// sem ambiguidade (2-9, A-Z exceto I, O, L).
const ALFABETO_SLUG = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'.split('')

export function gerarSlug(tamanho = 12): string {
  let s = ''
  for (let i = 0; i < tamanho; i++) {
    s += ALFABETO_SLUG[Math.floor(Math.random() * ALFABETO_SLUG.length)]
  }
  return s
}

// Código de resgate mostrado pro cliente — 6 chars.
export function gerarCodigoResgate(): string {
  return gerarSlug(6)
}

// Sorteio ponderado. peso(X) / soma_pesos_ativos. Retorna null se pool vazio.
// Aceita um randomizador injetável pra teste/simulação.
export function sortearBrinde(brindes: BrindeLite[], rng: () => number = Math.random): BrindeLite | null {
  const ativos = brindes.filter((b) => b.peso > 0)
  if (ativos.length === 0) return null
  const total = ativos.reduce((s, b) => s + b.peso, 0)
  let rand = rng() * total
  for (const b of ativos) {
    rand -= b.peso
    if (rand <= 0) return b
  }
  return ativos[ativos.length - 1]
}

// Mensagem padrão pós-feedback.
export const MENSAGEM_POS_FEEDBACK_PADRAO =
  'Obrigado pelo seu feedback! Sua opinião nos ajuda a melhorar.'

// Para a UI: chance efetiva de cada brinde com base nos pesos atuais.
export function chanceEfetiva(brindes: BrindeLite[]): Map<string, number> {
  const ativos = brindes.filter((b) => b.peso > 0)
  const total = ativos.reduce((s, b) => s + b.peso, 0)
  const m = new Map<string, number>()
  if (total === 0) return m
  for (const b of ativos) m.set(b.id, b.peso / total)
  return m
}
