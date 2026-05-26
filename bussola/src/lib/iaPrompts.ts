import { tempoDeCasa } from './tempoDeCasa'
import type { Profissional } from './profissionais'
import type { Feedback, TipoFeedback } from './feedbacks'

export type TomIA = 'direto' | 'acolhedor' | 'motivacional'

export interface ConfigIA {
  tom: TomIA
  categorizacao_auto: boolean
  resumo_semana: boolean
}

export const CONFIG_IA_PADRAO: ConfigIA = {
  tom: 'direto',
  categorizacao_auto: true,
  resumo_semana: true,
}

function ajusteTom(tom: TomIA): string {
  if (tom === 'acolhedor') return '\nUse um tom mais acolhedor e empático, sem perder a objetividade.'
  if (tom === 'motivacional') return '\nUse um tom mais motivacional e energético.'
  return ''
}

const TIPO_LABEL: Record<TipoFeedback, string> = {
  positivo: 'POSITIVO',
  negativo: 'NEGATIVO',
  observacao: 'OBSERVAÇÃO',
}

// ── Sugestão de fala para a reunião ───────────────────────────────
export function systemFala(tom: TomIA): string {
  return `Você é assistente de um dono de barbearia brasileiro preparando reunião semanal com a equipe. Receberá um feedback registrado durante a semana e deve sugerir UMA FRASE que o dono pode falar sobre esse feedback na reunião.

REGRAS RÍGIDAS:
- Máximo 25 palavras
- Em português coloquial brasileiro
- Comece com verbo de ação (Elogie, Reconheça, Comente, Pergunte, Mostre, Destaque)
- SEM "que tal", "considere", "talvez", "você poderia"
- SEM emojis na resposta
- Direto, sem rodeio
- Use o nome do profissional quando souber
- Se for feedback positivo: foque no comportamento observado e reforço
- Se for feedback negativo: aborde com firmeza mas respeito, sem humilhar
- Considere o contexto pessoal quando disponível${ajusteTom(tom)}

Responda APENAS com a frase sugerida. Sem introdução, sem explicação, sem aspas.`
}

export function userFala(prof: Profissional, fb: Feedback): string {
  const linhas: string[] = []
  const tempo = tempoDeCasa(prof.data_entrada)
  linhas.push(`Profissional: ${prof.nome}${prof.funcao ? ` (${prof.funcao})` : ''}`)
  if (tempo) linhas.push(`Tempo de casa: ${tempo}`)
  if (prof.motivadores && prof.motivadores.length) linhas.push(`Motivadores principais (em ordem): ${prof.motivadores.join(', ')}`)
  if (prof.estilo_comunicacao) linhas.push(`Estilo de comunicação preferido: ${prof.estilo_comunicacao}`)
  if (prof.pontos_fortes) linhas.push(`Pontos fortes conhecidos: ${prof.pontos_fortes}`)
  if (prof.pontos_desenvolvimento) linhas.push(`Pontos a desenvolver: ${prof.pontos_desenvolvimento}`)
  linhas.push(`Tipo do feedback: ${TIPO_LABEL[fb.tipo]}`)
  linhas.push(`Estrelas: ${fb.estrelas ?? '-'} de 5`)
  linhas.push(`Categoria: ${fb.categoria || 'não classificada'}`)
  linhas.push('')
  linhas.push('Texto do feedback (registrado pelo dono):')
  linhas.push(`"${fb.texto}"`)
  linhas.push('')
  linhas.push('Gere a sugestão de fala.')
  return linhas.join('\n')
}

// ── Categorização ─────────────────────────────────────────────────
export function systemCategoria(): string {
  return `Você categoriza feedbacks de barbearia. Receberá o texto e o tipo (positivo/negativo/observação) e deve responder APENAS com UMA das categorias abaixo:

- Técnico (corte, barba, química, técnica em si)
- Atendimento (relação com cliente, simpatia, escuta)
- Comportamento (postura geral, profissionalismo)
- Cultura (valores da casa, espírito de equipe)
- Vendas (oferta de produtos, upsell, retenção)
- Pontualidade (chegada, saída, presença)

Responda APENAS com o nome da categoria, em uma palavra. Sem explicação.

Se o feedback não se encaixar em nenhuma, responda: "Outro"`
}

export function userCategoria(tipo: TipoFeedback, texto: string): string {
  return `Tipo: ${TIPO_LABEL[tipo]}\nTexto: "${texto}"\n\nCategoria:`
}

// ── Resumo da semana ──────────────────────────────────────────────
export function systemResumo(tom: TomIA): string {
  return `Você resume a semana de uma barbearia em UM parágrafo curto, pra ajudar o dono a ter visão geral antes da reunião.

REGRAS:
- Máximo 4 frases (60-80 palavras)
- Tom objetivo, sem floreio
- Destaque: profissionais com mais elogios, pontos críticos, padrões repetidos
- Se houver alertas (graves), MENCIONAR
- Português coloquial brasileiro
- SEM listar tudo: filtre o que importa
- SEM emojis${ajusteTom(tom)}`
}
