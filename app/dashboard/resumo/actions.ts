'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { REGRAS_FIXAS } from '@/lib/regras'
import { cicloDeData } from '@/lib/ciclo'

interface BarbeiroLite { id: string; nome: string; tipo: 'barbeiro' | 'recepcionista' }
interface MetaIndLite {
  barbeiro_id: string
  bronze_comm: number; bronze_premio: string | null
  prata_comm: number;  prata_premio: string | null
  ouro_comm: number;   ouro_premio: string | null
}
interface CampSrv { emoji: string; nome: string; pontos: number }
interface CampPrm { posicao: number; valor: number }
interface CampLite {
  id: string
  min_pontos: number
  min_pontos_recep: number
  bonus_assin_qtd: number
  bonus_assin_valor: number
  regras_personalizadas: string | null
}

/**
 * Gera o texto da reunião juntando metas + campanha + regras (fixas e da
 * barbearia) e chamando a Anthropic. Devolve o texto pronto pra o dono
 * editar, copiar e mandar no WhatsApp.
 */
export async function gerarResumoReuniao(mes: number, ano: number): Promise<
  { texto: string } | { error: string }
> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'Geração de resumo indisponível no momento.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, dia_fechamento)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { nome: string; dia_fechamento: number | null } | null } | null }
  if (!usuario || !usuario.barbearias) return { error: 'Barbearia não encontrada.' }

  const barbeariaNome = usuario.barbearias.nome
  const diaFechamento = usuario.barbearias.dia_fechamento ?? 1
  const periodoLabel = cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento).label

  // ── Metas ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meta } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata, premio_coletivo, premio_coletivo_bronze, premio_coletivo_prata')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes).eq('ano', ano)
    .maybeSingle() as { data: {
      id: string
      meta_coletiva: number; meta_coletiva_bronze: number; meta_coletiva_prata: number
      premio_coletivo: string | null; premio_coletivo_bronze: string | null; premio_coletivo_prata: string | null
    } | null }

  let metasInd: MetaIndLite[] = []
  if (meta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mi } = await (supabase as any)
      .from('metas_individuais')
      .select('barbeiro_id, bronze_comm, bronze_premio, prata_comm, prata_premio, ouro_comm, ouro_premio')
      .eq('meta_id', meta.id)
    metasInd = (mi ?? []) as MetaIndLite[]
  }

  // ── Campanha ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campanha } = await (supabase as any)
    .from('campanha')
    .select('id, min_pontos, min_pontos_recep, bonus_assin_qtd, bonus_assin_valor, regras_personalizadas')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes).eq('ano', ano)
    .maybeSingle() as { data: CampLite | null }

  let campServicos: CampSrv[] = []
  let campPremios: CampPrm[] = []
  if (campanha) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: srv } = await (supabase as any)
      .from('campanha_servicos').select('emoji, nome, pontos').eq('campanha_id', campanha.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prm } = await (supabase as any)
      .from('campanha_premios').select('posicao, valor').eq('campanha_id', campanha.id).order('posicao')
    campServicos = (srv ?? []) as CampSrv[]
    campPremios = (prm ?? []) as CampPrm[]
  }

  // ── Barbeiros ativos ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbsRaw } = await (supabase as any)
    .from('barbeiros').select('id, nome, tipo')
    .eq('barbearia_id', usuario.barbearia_id).eq('ativo', true).order('nome')
  const barbeiros = (barbsRaw ?? []) as BarbeiroLite[]

  // ── Monta o contexto pra IA ───────────────────────────
  const fmtBRL = (n: number) =>
    `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const blocos: string[] = []
  blocos.push(`BARBEARIA: ${barbeariaNome}`)
  blocos.push(`PERÍODO: ${periodoLabel}`)

  if (meta) {
    const tiersColetivos: string[] = []
    const addTier = (label: string, valor: number, premio: string | null) => {
      if (!valor || valor <= 0) return
      let l = `${label}: ${fmtBRL(valor)}`
      if (premio) l += ` — prêmio: ${premio}`
      tiersColetivos.push(l)
    }
    addTier('Bronze', Number(meta.meta_coletiva_bronze) || 0, meta.premio_coletivo_bronze)
    addTier('Prata',  Number(meta.meta_coletiva_prata)  || 0, meta.premio_coletivo_prata)
    addTier('Ouro',   Number(meta.meta_coletiva)        || 0, meta.premio_coletivo)
    if (tiersColetivos.length > 0) {
      blocos.push(`META COLETIVA (tiers Bronze/Prata/Ouro):\n${tiersColetivos.map(t => `- ${t}`).join('\n')}`)
    }
  }

  if (metasInd.length > 0) {
    const linhas = metasInd
      .map(mi => {
        const b = barbeiros.find(x => x.id === mi.barbeiro_id)
        if (!b) return null
        const fmtTier = (val: number, premio: string | null) =>
          `${fmtBRL(Number(val) || 0)}${premio ? ` (${premio})` : ''}`
        return `- ${b.nome}: Bronze ${fmtTier(mi.bronze_comm, mi.bronze_premio)} · Prata ${fmtTier(mi.prata_comm, mi.prata_premio)} · Ouro ${fmtTier(mi.ouro_comm, mi.ouro_premio)}`
      })
      .filter((x): x is string => x !== null)
    if (linhas.length > 0) {
      blocos.push(`METAS INDIVIDUAIS:\n${linhas.join('\n')}`)
    }
  }

  if (campanha) {
    const camp: string[] = ['CAMPANHA DE PONTOS:']
    if (campServicos.length > 0) {
      camp.push('Serviços que pontuam:')
      for (const s of campServicos) camp.push(`  ${s.emoji} ${s.nome}: ${s.pontos} pts`)
    }
    camp.push(`Mínimo para participar: barbeiros ${campanha.min_pontos} pts · recepcionistas ${campanha.min_pontos_recep} pts`)
    if (campanha.bonus_assin_qtd > 0 && Number(campanha.bonus_assin_valor) > 0) {
      camp.push(`Bônus de assinaturas: ${campanha.bonus_assin_qtd}+ assinaturas vendidas = ${fmtBRL(Number(campanha.bonus_assin_valor))} extra`)
    }
    if (campPremios.length > 0) {
      camp.push('Premiação do ranking:')
      for (const p of campPremios) camp.push(`  ${p.posicao}º lugar: ${fmtBRL(Number(p.valor))}`)
    }
    blocos.push(camp.join('\n'))
  }

  blocos.push(
    `REGRAS GERAIS DO SISTEMA:\n${REGRAS_FIXAS.map(r => `- ${r}`).join('\n')}`
  )

  if (campanha?.regras_personalizadas) {
    blocos.push(`COMBINADOS DESTA BARBEARIA:\n${campanha.regras_personalizadas}`)
  }

  const contexto = blocos.join('\n\n')

  const prompt = `Você é um assistente de gestão de barbearias. Com base nos dados abaixo, crie um texto claro, direto e motivador para o dono apresentar à equipe na reunião de início de mês.

Tom: humano, respeitoso, sem coach, como um dono falando para sua equipe.

Estrutura:
1. Abertura motivadora (2 a 3 linhas)
2. Meta coletiva e o que todos ganham
3. Metas individuais de cada barbeiro
4. Como funciona a campanha de pontos
5. Regras gerais do sistema e combinados específicos da barbearia
6. Encerramento motivador (2 a 3 linhas)

Dados:
${contexto}

Retorne somente o texto formatado, pronto para ser lido em reunião ou enviado no WhatsApp do grupo.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = msg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()

    if (!texto) return { error: 'Não consegui gerar o resumo agora.' }
    return { texto }
  } catch (err) {
    console.error('[gerarResumoReuniao] erro:', err)
    return { error: 'Erro ao gerar o resumo. Tente de novo em alguns segundos.' }
  }
}
