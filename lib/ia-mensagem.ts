import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from './supabase/admin'
import type { MetaIndividual } from '@/types/database'

interface Params {
  barbeiro_id: string
  nome: string
  comissao: number
  metaInd: MetaIndividual | null
  diasRestantes: number
  diasCorridos: number
  posicaoRanking: number
  totalBarbeiros: number
}

export async function obterMensagemDiaria(params: Params): Promise<string | null> {
  const hoje = new Date().toISOString().split('T')[0]
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cached } = await (supabase as any)
    .from('mensagens_ia')
    .select('mensagem')
    .eq('barbeiro_id', params.barbeiro_id)
    .eq('data', hoje)
    .single()

  if (cached?.mensagem) return cached.mensagem as string

  try {
    const { nome, comissao, metaInd, diasRestantes, diasCorridos, posicaoRanking, totalBarbeiros } = params
    const ritmoAtual = diasCorridos > 0 ? comissao / diasCorridos : 0

    const pct = (meta: number) => meta > 0 ? Math.round((comissao / meta) * 100) : 0
    const b = metaInd?.bronze_comm ?? 0
    const p = metaInd?.prata_comm  ?? 0
    const o = metaInd?.ouro_comm   ?? 0

    let proximaMeta = 0
    let proximaNivel = ''
    if (b > 0 && comissao < b) { proximaMeta = b; proximaNivel = 'Bronze' }
    else if (p > 0 && comissao < p) { proximaMeta = p; proximaNivel = 'Prata' }
    else if (o > 0 && comissao < o) { proximaMeta = o; proximaNivel = 'Ouro' }

    const necesarioPorDia = diasRestantes > 0 && proximaMeta > comissao
      ? Math.round((proximaMeta - comissao) / diasRestantes)
      : 0

    const prompt = `Você é o assistente do BarberMeta. Escreva UMA mensagem motivacional curta (máximo 2 frases) para o barbeiro abaixo.
Tom: direto, humano, sem coach motivacional, sem exagero, sem emojis.

Nome: ${nome}
Comissão: R$ ${Math.round(comissao)}
Bronze: ${pct(b)}% | Prata: ${pct(p)}% | Ouro: ${pct(o)}%
Próxima meta: ${proximaNivel || 'todas atingidas'}${proximaNivel ? ` — faltam R$ ${Math.round(proximaMeta - comissao)}` : ''}
Ritmo atual: R$ ${Math.round(ritmoAtual)}/dia | Necessário: R$ ${necesarioPorDia}/dia
Dias restantes: ${diasRestantes} | Posição no ranking: ${posicaoRanking}º de ${totalBarbeiros}

Responda APENAS com a mensagem, sem aspas.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    })

    const mensagem = msg.content[0].type === 'text' ? msg.content[0].text.trim() : null
    if (!mensagem) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('mensagens_ia').insert({
      barbeiro_id: params.barbeiro_id,
      data: hoje,
      mensagem,
    })

    return mensagem
  } catch {
    return null
  }
}
