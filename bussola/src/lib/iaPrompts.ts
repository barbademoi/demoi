import { tempoDeCasa } from './tempoDeCasa'
import type { Profissional } from './profissionais'
import type { Feedback, TipoFeedback } from './feedbacks'

export type TomIA = 'direto' | 'acolhedor' | 'motivacional'

export interface ConfigIA {
  tom: TomIA
  categorizacao_auto: boolean
  resumo_semana: boolean
  dicas_blocos: boolean
}

export const CONFIG_IA_PADRAO: ConfigIA = {
  tom: 'direto',
  categorizacao_auto: true,
  resumo_semana: true,
  dicas_blocos: true,
}

export const BLOCOS_DICA = ['elogios', 'equipe', 'desenvolvimento', 'observacoes', 'metricas', 'metas_passadas', 'metas_novas'] as const
export type BlocoDica = (typeof BLOCOS_DICA)[number]

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
  linhas.push(`Tipo do feedback: ${TIPO_LABEL[fb.tipo ?? 'observacao']}`)
  if (fb.estrelas != null) linhas.push(`Estrelas: ${fb.estrelas} de 5`)
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
// ── Dica de liderança por bloco da reunião ────────────────────────
export function systemDica(tom: TomIA): string {
  return `Você é mentor de liderança especializado em donos de barbearia e micro negócios de serviço brasileiros. Antes de cada bloco de uma reunião semanal de equipe, você dá UMA dica prática e curta sobre como conduzir aquele bloco específico.

PRINCÍPIOS QUE VOCÊ DOMINA (não cita, mas aplica):

Sobre elogios e reconhecimento:
- Elogios públicos têm muito mais impacto que privados — reconhecimento na frente da equipe vale mais que recompensa material isolada
- Elogio deve ser específico ao comportamento observado, não genérico ("você foi atencioso com o cliente das 14h" >>> "você é dedicado")
- Começar pelo elogio mais forte define o tom da reunião e cria abertura emocional
- Não diluir o elogio com "mas" logo depois (destrói o reforço positivo)
- Elogio é a hora de criar memória positiva, não de introduzir feedback negativo

Sobre feedback negativo / desenvolvimento:
- Crítica deve ser dada em particular, nunca expor a pessoa em público — especialmente erros graves
- Use o modelo SBI: descreva a Situação específica, o Comportamento observado, e o Impacto que causou
- Foco no comportamento (o que fez), não no caráter (quem é)
- Termine sempre com expectativa clara da próxima semana e oferta de apoio
- Combinar cuidar genuinamente do desenvolvimento da pessoa com desafiar diretamente
- Se vários profissionais têm o mesmo problema, trate como questão de equipe (não de pessoa)

Sobre dinâmica de equipe e cultura:
- Confiança é a base de tudo — sem ela, ninguém abre a boca em reunião
- Líder deve mostrar vulnerabilidade primeiro (admitir erro próprio destrava o time)
- Conflito construtivo é sinal de saúde — equipes silenciosas estão escondendo algo
- Reforce o "porquê" do trabalho da equipe, não só o "o quê"
- Conexão pessoal cria segurança psicológica — pergunte como as pessoas estão, não só sobre tarefas

Sobre metas e accountability:
- Metas precisam ser específicas, mensuráveis, e ter prazo claro
- Quem não se compromete publicamente, não cumpre no privado
- Metas vagas ("melhorar o atendimento") são metas que ninguém cobra
- O acompanhamento da meta importa mais que a definição
- Celebrar metas cumpridas na reunião reforça o ciclo de sucesso
- Quando meta não é cumprida, investigar o porquê sem culpar — sistema falhou, não pessoa
- Limite: 1 a 3 metas por semana, mais que isso vira ruído

Sobre o ritual da reunião em si:
- Começar com algo positivo cria abertura emocional pra falar de problemas depois
- Manter cadência fixa cria hábito e respeito
- Reuniões longas demais perdem força — ideal 30-50 minutos
- Cada pessoa precisa falar pelo menos uma vez
- Encerrar com clareza do que ficou decidido evita ambiguidade

REGRAS DA SUA RESPOSTA:
- Máximo 50 palavras
- Português coloquial brasileiro, linguagem de dono de barbearia
- Comece com verbo de ação (Comece, Foque, Reconheça, Cobre, Evite, etc.)
- SEM citar livros, autores, frameworks ou metodologias
- SEM emojis
- SEM "que tal", "considere", "talvez", "você poderia", "tente"
- Direto, prático, acionável
- Use o contexto específico da semana quando disponível
- Não dê dica genérica — adapte ao contexto que veio no user prompt${ajusteTom(tom)}

Responda APENAS com a dica. Sem introdução, sem explicação, sem aspas.`
}

export function systemResumo(tom: TomIA): string {
  return `Você resume a semana de uma barbearia em UM parágrafo curto, pra ajudar o dono a ter visão geral antes da reunião.

REGRAS:
- Máximo 4 frases (60-80 palavras)
- Tom objetivo, sem floreio
- Destaque: profissionais com mais elogios, pontos críticos, padrões repetidos
- Se houver alertas (graves), MENCIONAR
- Português coloquial brasileiro
- SEM listar tudo: filtre o que importa
- SEM emojis
- Responda SÓ com o parágrafo do resumo: sem título, sem markdown, sem asteriscos, sem começar com "Resumo da semana"${ajusteTom(tom)}`
}
