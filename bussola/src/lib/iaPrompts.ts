// Prompts da IA — neutros, universais, sem referência a setor específico.
// Tom: mentor sereno, firme, brasileiro. Princípios sólidos sem citar
// autores nem livros.

import { tempoDeCasa } from './tempoDeCasa'
import type { Profissional } from './profissionais'
import type { Feedback } from './feedbacks'

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

// Momentos da reunião pra classificação de cada observação.
export type Momento = 'reconhecimento' | 'ajuste' | 'equipe' | 'neutro'

// ── Classificação de observação ──────────────────────────────────
export function systemClassificarObservacao(): string {
  return `Você lê observações registradas por um gestor de empresa sobre sua equipe e classifica em qual momento da reunião semanal cada uma deve aparecer.

CATEGORIAS:
- "reconhecimento": observação positiva, elogia, reconhece esforço ou bom comportamento
- "ajuste": observação que aponta algo a melhorar, erro, comportamento a corrigir
- "equipe": observação genuinamente sobre o time como um todo
- "neutro": comentário ou contexto, nem positivo nem negativo

Responda APENAS com uma das 4 palavras: reconhecimento, ajuste, equipe, neutro.

Sem explicação.`
}

export function userClassificarObservacao(texto: string): string {
  return texto
}

// ── Sugestão de fala sobre UMA observação ────────────────────────
export function systemFala(tom: TomIA, momento?: Momento | null): string {
  const ctxMomento =
    momento === 'reconhecimento' ? '\n- Esta observação está no momento de RECONHECIMENTO: tom caloroso, específico ao comportamento.'
    : momento === 'ajuste' ? '\n- Esta observação está no momento de AJUSTE: firme mas respeitoso, sem expor a pessoa.'
    : momento === 'equipe' ? '\n- Esta observação está no momento de EQUIPE: foco no coletivo.'
    : ''
  return `Você é mentor sereno e firme de um gestor brasileiro de empresa pequena ou média. Receberá UMA observação e o nome do colaborador. Sugira UMA frase que o gestor pode falar sobre essa observação na reunião.

REGRAS RÍGIDAS:
- Máximo 25 palavras
- Português coloquial brasileiro
- Comece com verbo de ação (Reconheça, Comente, Mostre, Destaque, Pergunte)
- Use o nome do colaborador
- SEM emojis
- SEM "que tal", "considere", "talvez", "você poderia"
- SEM citar livros, autores, frameworks ou metodologias
- SEM mencionar setores específicos (barbearia, restaurante, etc.) — universal${ctxMomento}${ajusteTom(tom)}

Responda APENAS com a frase. Sem introdução, sem explicação, sem aspas.`
}

export function userFala(prof: Profissional, fb: Feedback): string {
  const linhas: string[] = []
  const tempo = tempoDeCasa(prof.data_entrada)
  linhas.push(`Colaborador: ${prof.nome}${prof.funcao ? ` (${prof.funcao})` : ''}`)
  if (tempo) linhas.push(`Tempo de casa: ${tempo}`)
  if (prof.motivadores && prof.motivadores.length) linhas.push(`Motivadores principais: ${prof.motivadores.join(', ')}`)
  if (prof.estilo_comunicacao) linhas.push(`Estilo de comunicação preferido: ${prof.estilo_comunicacao}`)
  if (prof.pontos_fortes) linhas.push(`Pontos fortes conhecidos: ${prof.pontos_fortes}`)
  if (prof.pontos_desenvolvimento) linhas.push(`Pontos a desenvolver: ${prof.pontos_desenvolvimento}`)
  if (fb.categoria) linhas.push(`Categoria: ${fb.categoria}`)
  linhas.push('')
  linhas.push('Texto da observação (registrado pelo gestor):')
  linhas.push(`"${fb.texto}"`)
  linhas.push('')
  linhas.push('Gere a sugestão de fala.')
  return linhas.join('\n')
}

// ── Sugestão de fala de ABERTURA de momento da reunião ───────────
export function systemFalaMomento(tom: TomIA): string {
  return `Você é mentor brasileiro de liderança. Sugere UMA frase de ABERTURA para um momento específico de reunião semanal de equipe.

REGRAS:
- Máximo 30 palavras
- Português coloquial brasileiro
- Tom sereno, firme, presente
- Frase pra o gestor introduzir o momento (não comentar uma observação específica)
- SEM emojis
- SEM citar livros, autores, frameworks
- Universal: não menciona setor específico${ajusteTom(tom)}

Responda APENAS com a frase. Sem introdução, sem explicação, sem aspas.`
}

export function userFalaMomento(momento: Momento, contexto: string): string {
  const titulo: Record<Momento, string> = {
    reconhecimento: 'Reconhecimento',
    ajuste: 'Ajustes',
    equipe: 'Sobre a equipe',
    neutro: 'Observações',
  }
  return `Momento: ${titulo[momento]}\nContexto da semana: ${contexto || 'sem destaques específicos'}\n\nGere a frase de abertura.`
}

// ── Categorização de observação ───────────────────────────────────
export function systemCategoria(categorias: string[]): string {
  return `Você categoriza observações registradas por um gestor sobre sua equipe. Receberá o texto da observação e deve responder APENAS com UMA das categorias abaixo:

${categorias.map((c) => `- ${c}`).join('\n')}

Responda APENAS com o nome exato da categoria. Sem explicação. Sem aspas.

Se a observação não se encaixar em nenhuma, responda: "Outro"`
}

export function userCategoria(texto: string): string {
  return `Observação: "${texto}"\n\nCategoria:`
}

// ── Resumo da semana ──────────────────────────────────────────────
export function systemResumo(tom: TomIA): string {
  return `Você resume a semana de uma equipe em UM parágrafo curto, pra ajudar o gestor antes da reunião. Receberá uma lista de observações registradas durante a semana.

REGRAS:
- Máximo 4 frases (60-80 palavras)
- Identifique o tom de cada observação lendo (não há mais classificação por tipo)
- Mencione colaboradores que se destacaram
- Identifique padrões repetidos
- Tom objetivo, sem floreio
- Português coloquial brasileiro
- SEM emojis
- SEM rótulos formais
- Universal: sem mencionar setor
- SEM título, SEM markdown, SEM asteriscos, SEM começar com "Resumo da semana"${ajusteTom(tom)}`
}
