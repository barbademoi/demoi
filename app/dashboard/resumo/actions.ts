'use server'

import { createClient } from '@/lib/supabase/server'
import { pegarRegrasGerais } from '@/lib/regras'
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
 * Monta o texto de abertura do mês juntando metas + campanha + regras (fixas e
 * da barbearia). O texto é montado por TEMPLATE, sem IA: os mesmos dados geram
 * sempre o mesmo texto, e nada sai do servidor. Devolve pronto pro dono editar,
 * copiar e mandar no WhatsApp.
 */
export async function gerarResumoReuniao(mes: number, ano: number): Promise<
  { texto: string } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, dia_fechamento, regras_gerais)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { nome: string; dia_fechamento: number | null; regras_gerais: string[] | null } | null } | null }
  if (!usuario || !usuario.barbearias) return { error: 'Barbearia não encontrada.' }

  const barbeariaNome = usuario.barbearias.nome
  const diaFechamento = usuario.barbearias.dia_fechamento ?? 1
  const regrasGerais = pegarRegrasGerais(usuario.barbearias.regras_gerais)
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

  // ── Texto da reunião, montado por TEMPLATE (sem IA) ───
  // O texto é lido em voz alta ou colado no WhatsApp, então sai em frases
  // corridas em PT-BR — nada de rótulo em caixa alta, que era formato de
  // contexto pra máquina, não de recado pra equipe.
  const fmtBRL = (n: number) =>
    `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const blocos: string[] = []

  blocos.push(
    `${barbeariaNome} — metas de ${periodoLabel}\n\n` +
    `Pessoal, esse é o combinado do mês. Está tudo aqui: o que a casa precisa bater, ` +
    `a meta de cada um e como funciona a pontuação.`,
  )

  if (meta) {
    const tiers: string[] = []
    const addTier = (label: string, valor: number, premio: string | null) => {
      if (!valor || valor <= 0) return
      tiers.push(`• ${label}: ${fmtBRL(valor)}${premio ? ` — ${premio}` : ''}`)
    }
    addTier('Bronze', Number(meta.meta_coletiva_bronze) || 0, meta.premio_coletivo_bronze)
    addTier('Prata',  Number(meta.meta_coletiva_prata)  || 0, meta.premio_coletivo_prata)
    addTier('Ouro',   Number(meta.meta_coletiva)        || 0, meta.premio_coletivo)
    if (tiers.length > 0) {
      const nomes = tiers.length === 1 ? 'a meta da casa' : `os ${tiers.length} níveis da meta da casa`
      blocos.push(`META DA CASA\nQuando a casa bate, todo mundo ganha. Esses são ${nomes}:\n${tiers.join('\n')}`)
    }
  }

  if (metasInd.length > 0) {
    const linhas = metasInd
      .map(mi => {
        const b = barbeiros.find(x => x.id === mi.barbeiro_id)
        if (!b) return null
        const tier = (val: number, premio: string | null) =>
          `${fmtBRL(Number(val) || 0)}${premio ? ` (${premio})` : ''}`
        return `• ${b.nome} — Bronze ${tier(mi.bronze_comm, mi.bronze_premio)} · ` +
               `Prata ${tier(mi.prata_comm, mi.prata_premio)} · Ouro ${tier(mi.ouro_comm, mi.ouro_premio)}`
      })
      .filter((x): x is string => x !== null)
    if (linhas.length > 0) {
      blocos.push(`METAS INDIVIDUAIS\nCada um tem três degraus. Bateu o degrau, ganhou o prêmio dele:\n${linhas.join('\n')}`)
    }
  }

  if (campanha) {
    const camp: string[] = ['CAMPANHA DE PONTOS']
    if (campServicos.length > 0) {
      camp.push('Serviços que valem ponto:')
      for (const sv of campServicos) camp.push(`• ${sv.emoji} ${sv.nome} — ${sv.pontos} ${sv.pontos === 1 ? 'ponto' : 'pontos'}`)
    }
    camp.push(
      `Pra entrar na disputa: ${campanha.min_pontos} ${campanha.min_pontos === 1 ? 'ponto' : 'pontos'} ` +
      `(barbeiros) e ${campanha.min_pontos_recep} ${campanha.min_pontos_recep === 1 ? 'ponto' : 'pontos'} (recepção).`,
    )
    if (campanha.bonus_assin_qtd > 0 && Number(campanha.bonus_assin_valor) > 0) {
      camp.push(`Bônus de assinatura: quem vender ${campanha.bonus_assin_qtd} ou mais leva ${fmtBRL(Number(campanha.bonus_assin_valor))} extra.`)
    }
    if (campPremios.length > 0) {
      camp.push('Premiação do ranking:')
      for (const pr of campPremios) camp.push(`• ${pr.posicao}º lugar — ${fmtBRL(Number(pr.valor))}`)
    }
    blocos.push(camp.join('\n'))
  }

  blocos.push(`COMO FUNCIONA\n${regrasGerais.map(r => `• ${r}`).join('\n')}`)

  if (campanha?.regras_personalizadas) {
    blocos.push(`COMBINADOS DA CASA\n${campanha.regras_personalizadas}`)
  }

  blocos.push('Qualquer dúvida sobre meta ou pontuação, me chama. Bom mês a todos.')

  return { texto: blocos.join('\n\n') }
}
