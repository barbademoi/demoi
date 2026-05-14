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
  diasUteisRestantes: number
  diasUteisCorridos: number
  posicaoRanking: number   // 1-based; 0 = não está no ranking este mês
  totalBarbeiros: number   // total de barbeiros ATIVOS da barbearia (não só quem lançou)
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
    const { nome, comissao, metaInd, diasRestantes, diasCorridos, diasUteisRestantes, diasUteisCorridos, posicaoRanking, totalBarbeiros } = params

    // Usa dias úteis para ritmo — mais preciso para barbearia (Seg–Sáb)
    const ritmoAtual = diasUteisCorridos > 0 ? comissao / diasUteisCorridos : 0

    const pct = (meta: number) => meta > 0 ? Math.round((comissao / meta) * 100) : 0
    const b = metaInd?.bronze_comm ?? 0
    const p = metaInd?.prata_comm  ?? 0
    const o = metaInd?.ouro_comm   ?? 0

    let proximaMeta = 0
    let proximaNivel = ''
    if (b > 0 && comissao < b) { proximaMeta = b; proximaNivel = 'Bronze' }
    else if (p > 0 && comissao < p) { proximaMeta = p; proximaNivel = 'Prata' }
    else if (o > 0 && comissao < o) { proximaMeta = o; proximaNivel = 'Ouro' }

    const necesarioPorDiaUtil = diasUteisRestantes > 0 && proximaMeta > comissao
      ? Math.round((proximaMeta - comissao) / diasUteisRestantes)
      : 0

    // Só inclui ranking se o dado é confiável
    const rankingValido = posicaoRanking >= 1 && posicaoRanking <= totalBarbeiros && totalBarbeiros >= 2
    const rankingLine = rankingValido
      ? `Posição no ranking da equipe: ${posicaoRanking}º de ${totalBarbeiros} barbeiros`
      : `Total de barbeiros na equipe: ${totalBarbeiros}`

    const prompt = `Você é o assistente do BarberMeta. Escreva UMA mensagem motivacional curta (máximo 2 frases) para o barbeiro abaixo.
Tom: direto, humano, sem coach motivacional, sem exagero, sem emojis.
REGRA CRÍTICA: use SOMENTE os dados fornecidos abaixo. Nunca invente ou infira posições, valores ou porcentagens.

Nome: ${nome}
Comissão acumulada no mês: R$ ${Math.round(comissao)}
Meta Bronze: R$ ${Math.round(b)} (${pct(b)}% atingido)
Meta Prata: R$ ${Math.round(p)} (${pct(p)}% atingido)
Meta Ouro: R$ ${Math.round(o)} (${pct(o)}% atingido)
Próxima meta a atingir: ${proximaNivel || 'todas atingidas'}${proximaNivel ? ` — faltam R$ ${Math.round(proximaMeta - comissao)}` : ''}
Ritmo atual (dias úteis trabalhados): R$ ${Math.round(ritmoAtual)}/dia útil
Ritmo necessário para próxima meta: R$ ${necesarioPorDiaUtil}/dia útil
Dias úteis trabalhados no mês: ${diasUteisCorridos} | Dias úteis restantes: ${diasUteisRestantes}
Dias corridos: ${diasCorridos} | Dias corridos restantes: ${diasRestantes}
${rankingLine}

Responda APENAS com a mensagem, sem aspas, sem prefixo.`

    // Log de validação — visível nos logs do servidor/Vercel
    console.log('[IA-MENSAGEM] Dados enviados para API:', {
      nome,
      comissao: Math.round(comissao),
      pctBronze: pct(b),
      pctPrata: pct(p),
      pctOuro: pct(o),
      proximaNivel,
      ritmoAtual: Math.round(ritmoAtual),
      necesarioPorDiaUtil,
      diasUteisCorridos,
      diasUteisRestantes,
      diasCorridos,
      diasRestantes,
      posicaoRanking,
      totalBarbeiros,
      rankingValido,
    })

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
  } catch (err) {
    console.error('[IA-MENSAGEM] Erro ao gerar mensagem:', err)
    return null
  }
}
