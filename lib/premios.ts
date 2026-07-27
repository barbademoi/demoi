/**
 * PREMIAÇÃO DO MÊS — cálculo ÚNICO e compartilhado entre a tela do barbeiro
 * (/b/[codigo]) e o dashboard do dono. Chamar a MESMA função nos dois lugares
 * garante que os números batem: o "já garantido" total do dono é exatamente a
 * soma dos "já garantido" individuais que cada barbeiro vê.
 *
 * REGRAS:
 *  - META (Bronze/Prata/Ouro): vale SÓ o MAIOR nível ATINGIDO (não soma tiers).
 *  - CAMPANHA de pontos: prêmio SEPARADO (trilha independente) — soma por cima.
 *  - Só conta prêmio com VALOR > 0. Prêmio de meta é texto livre (ex.: "R$ 250",
 *    "Pizza") → extrai o R$; sem valor numérico, não entra na conta.
 *  - Só leitura. Reaproveita metas/prêmios/pontos/ranking já existentes.
 *
 * Fuso/ciclo: os valores de entrada (comissao_acumulada do ciclo, pontos do
 * ciclo) já vêm apurados no ciclo 26→25 / America/Sao_Paulo por quem chama.
 */
import { calcTier } from './utils'
import type { Tier } from '@/types/database'

const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' }
const TIERS_ORDEM: Tier[] = ['bronze', 'prata', 'ouro']

/**
 * Extrai um valor em R$ de um texto de prêmio (campo livre do dono).
 * Aceita "R$ 250", "250", "R$ 1.200", "250,00", "1.200,50". Texto sem número
 * (ex.: "Pizza") → 0. Só retorna valor positivo.
 */
export function parseValorPremio(txt: string | null | undefined): number {
  if (!txt) return 0
  const texto = String(txt)
  // Em textos mistos ("1 folga + R$ 100"), prioriza o trecho marcado como
  // moeda pra não transformar números descritivos em um prêmio inexistente.
  const trechoMoeda = texto.match(/R\$\s*(\d[\d.\s]*(?:,\d{1,2})?)/i)?.[1]
  const trecho = trechoMoeda ?? texto.match(/\d[\d.\s]*(?:,\d{1,2})?/)?.[0]
  if (!trecho) return 0
  const normalizado = trecho.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(normalizado)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export interface MetaTiers {
  bronze_comm: number; bronze_premio: string | null
  prata_comm: number;  prata_premio: string | null
  ouro_comm: number;   ouro_premio: string | null
}

export interface BarbeiroPremioInput {
  id: string
  nome: string
  tipo: string                 // 'barbeiro' | 'recepcionista'
  /** Valor base do ciclo (comissao_acumulada) — mesma chave do ranking/metas. */
  comissao: number
  /** Pontos do ciclo (mesma fonte do ranking de pontos). */
  pontos: number
  /** Metas individuais do barbeiro (tiers + prêmios). null = sem meta. */
  meta: MetaTiers | null
}

export interface CampanhaPremioInput {
  min_pontos: number
  min_pontos_recep: number
  premios: Array<{ posicao: number; valor: number }>
}

export interface PremioBarbeiro {
  barbeiroId: string
  nome: string
  // Meta (maior nível atingido)
  metaTier: Tier | null
  metaTierLabel: string | null
  metaPremio: number
  // Próximo degrau de meta (o mais próximo ainda não batido, com prêmio > 0)
  proxMetaTier: Tier | null
  proxMetaTierLabel: string | null
  proxMetaPremio: number
  proxMetaFalta: number        // R$ que falta pra atingir
  // Campanha de pontos
  campanhaAtingida: boolean
  campanhaPremio: number
  campanhaProxPremio: number    // prêmio projetado se atingir o mínimo
  campanhaFaltaPts: number      // pontos que faltam pra qualificar (0 se já)
  // Totais
  jaGarantido: number           // metaPremio + campanhaPremio
  potencialProximo: number      // já garantido + upgrade do próximo degrau de meta
}

export interface PremiacaoResumo {
  temPremiacao: boolean         // há algum prêmio cadastrado com valor > 0
  totalJaGarantido: number
  totalPotencial: number
  barbeiros: PremioBarbeiro[]
}

export function calcularPremiacao(
  barbeiros: BarbeiroPremioInput[],
  campanha: CampanhaPremioInput | null,
): PremiacaoResumo {
  // ── Campanha: prêmio por posição no ranking de pontos ──
  // Prêmios ordenados por posição; o N-ésimo QUALIFICADO leva o N-ésimo prêmio.
  const premiosOrd = (campanha?.premios ?? [])
    .filter(p => Number(p.valor) > 0)
    .sort((a, b) => a.posicao - b.posicao)

  const minDe = (tipo: string) =>
    tipo === 'recepcionista' ? (campanha?.min_pontos_recep ?? 0) : (campanha?.min_pontos ?? 0)

  // A interface atual mantém rankings independentes para barbeiros e
  // recepcionistas. A premiação reinicia na 1ª posição dentro de cada grupo.
  const grupos = ['barbeiro', 'recepcionista'] as const
  const pertenceAoGrupo = (tipo: string, grupo: typeof grupos[number]) =>
    grupo === 'recepcionista' ? tipo === 'recepcionista' : tipo !== 'recepcionista'
  const ordenar = (lista: BarbeiroPremioInput[]) =>
    lista.sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome, 'pt-BR'))

  const campanhaPremioPorBarbeiro = new Map<string, number>()
  if (campanha) {
    for (const grupo of grupos) {
      const qualificados = ordenar(barbeiros.filter(b =>
        pertenceAoGrupo(b.tipo, grupo) &&
        b.pontos >= minDe(b.tipo) &&
        (minDe(b.tipo) > 0 || b.pontos > 0)
      ))
      qualificados.forEach((b, i) => {
        const val = premiosOrd[i]?.valor ?? 0
        if (val > 0) campanhaPremioPorBarbeiro.set(b.id, val)
      })
    }
  }

  // Projeção da campanha: mantém os pontos de quem já qualificou e leva cada
  // não qualificado apenas até o mínimo. As posições continuam exclusivas
  // dentro de cada um dos dois rankings existentes.
  const campanhaPotencialPorBarbeiro = new Map<string, number>()
  if (campanha) {
    for (const grupo of grupos) {
      const projetados = ordenar(
        barbeiros
          .filter(b => pertenceAoGrupo(b.tipo, grupo))
          .map(b => ({ ...b, pontos: Math.max(b.pontos, minDe(b.tipo)) }))
          .filter(b => minDe(b.tipo) > 0 || b.pontos > 0)
      )
      projetados.forEach((b, i) => {
        const val = premiosOrd[i]?.valor ?? 0
        if (val > 0) campanhaPotencialPorBarbeiro.set(b.id, val)
      })
    }
  }

  const linhas: PremioBarbeiro[] = barbeiros.map(b => {
    // ── Meta: maior nível atingido ──
    const m = b.meta
    const tier = m ? calcTier(b.comissao, m.bronze_comm, m.prata_comm, m.ouro_comm) : null
    const premioDoTier = (t: Tier | null): number => {
      if (!m || !t) return 0
      return parseValorPremio(t === 'ouro' ? m.ouro_premio : t === 'prata' ? m.prata_premio : m.bronze_premio)
    }
    const metaPremio = premioDoTier(tier)

    // ── Próximo degrau de meta: menor tier ainda não batido, com prêmio > 0 ──
    let proxMetaTier: Tier | null = null
    let proxMetaPremio = 0
    let proxMetaFalta = 0
    if (m) {
      for (const t of TIERS_ORDEM) {
        const comm = t === 'ouro' ? m.ouro_comm : t === 'prata' ? m.prata_comm : m.bronze_comm
        if (comm > 0 && b.comissao < comm && premioDoTier(t) > 0) {
          proxMetaTier = t
          proxMetaPremio = premioDoTier(t)
          proxMetaFalta = comm - b.comissao
          break
        }
      }
    }

    // ── Campanha ──
    const campanhaPremio = campanhaPremioPorBarbeiro.get(b.id) ?? 0
    const campanhaProxPremio = campanhaPremio > 0
      ? 0
      : (campanhaPotencialPorBarbeiro.get(b.id) ?? 0)
    const min = minDe(b.tipo)
    const qualificado = campanha ? b.pontos >= min : false
    const campanhaFaltaPts = campanha && !qualificado && campanhaProxPremio > 0
      ? Math.max(0, min - b.pontos)
      : 0

    const jaGarantido = metaPremio + campanhaPremio
    // Potencial = próximo degrau de cada trilha aberta. Meta substitui o tier
    // atual; campanha soma separadamente, assim como no "já garantido".
    const potencialMeta = proxMetaTier ? proxMetaPremio : metaPremio
    const potencialCampanha = campanhaPremio || campanhaProxPremio
    const potencialProximo = potencialMeta + potencialCampanha

    return {
      barbeiroId: b.id,
      nome: b.nome,
      metaTier: tier,
      metaTierLabel: tier ? TIER_LABEL[tier] : null,
      metaPremio,
      proxMetaTier,
      proxMetaTierLabel: proxMetaTier ? TIER_LABEL[proxMetaTier] : null,
      proxMetaPremio,
      proxMetaFalta,
      campanhaAtingida: campanhaPremio > 0,
      campanhaPremio,
      campanhaProxPremio,
      campanhaFaltaPts,
      jaGarantido,
      potencialProximo,
    }
  })

  const totalJaGarantido = linhas.reduce((s, l) => s + l.jaGarantido, 0)
  const totalPotencial = linhas.reduce((s, l) => s + l.potencialProximo, 0)

  // Há premiação cadastrada? (prêmio de campanha > 0 OU algum prêmio de meta com R$)
  const temCampanha = premiosOrd.length > 0
  const temMeta = barbeiros.some(b => b.meta && (
    parseValorPremio(b.meta.bronze_premio) > 0 ||
    parseValorPremio(b.meta.prata_premio) > 0 ||
    parseValorPremio(b.meta.ouro_premio) > 0
  ))

  return {
    temPremiacao: temCampanha || temMeta,
    totalJaGarantido,
    totalPotencial,
    barbeiros: linhas,
  }
}
