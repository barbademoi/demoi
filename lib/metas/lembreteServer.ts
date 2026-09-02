// Monta o lembrete de meta no SERVIDOR.
//
// A decisão é tomada aqui, e não no navegador, pelo mesmo motivo do popup da
// Brindoleta: quando o lembrete não deve aparecer, o componente sequer é
// montado. Nada de renderizar escondido e esconder com CSS.

import type { SupabaseClient } from '@supabase/supabase-js'
import { cicloAtual } from '@/lib/ciclo'
import { estaFechado } from '@/lib/mesFechado'
import {
  decidirLembreteMeta, metaEstaCadastrada, urgenciaDoCiclo, textoLembrete,
  type TextoLembrete,
} from '@/lib/metas/lembrete'

export interface LembreteMeta extends TextoLembrete {
  mes: number
  ano: number
  cicloLabel: string
  diasRestantes: number
}

/**
 * Devolve o lembrete, ou `null` quando ele não deve aparecer.
 *
 * O ciclo é sempre o VIGENTE, mesmo que o dono esteja navegando um mês passado
 * no dashboard: o lembrete é sobre o mês que está correndo agora, e olhar
 * agosto não muda o fato de setembro estar sem meta.
 */
export async function montarLembreteMeta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  barbeariaId: string,
  usuarioId: string,
  diaFechamento: number,
): Promise<LembreteMeta | null> {
  const ciclo = cicloAtual(diaFechamento)
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [metaRes, barbeirosRes, modoRes, adiamentoRes] = await Promise.all([
    sb.from('metas')
      .select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata')
      .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle(),
    sb.from('barbeiros').select('id', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId).eq('ativo', true),
    sb.from('modo_mes').select('modo')
      .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle(),
    sb.from('lembrete_meta_estado').select('adiado_ate')
      .eq('usuario_id', usuarioId).eq('mes', mes).eq('ano', ano).maybeSingle(),
  ])

  const meta = metaRes.data as {
    id: string
    meta_coletiva: number | null
    meta_coletiva_bronze: number | null
    meta_coletiva_prata: number | null
  } | null

  // As individuais só são consultadas quando a coletiva não resolve — uma
  // barbearia pode usar só meta individual, e cobrar meta dela seria falso.
  let individuais: { bronze_comm: number | null; prata_comm: number | null; ouro_comm: number | null }[] = []
  if (meta?.id) {
    const { data } = await sb.from('metas_individuais')
      .select('bronze_comm, prata_comm, ouro_comm').eq('meta_id', meta.id)
    individuais = data ?? []
  }

  const trava = await estaFechado(supabase, barbeariaId, mes, ano)

  const adiadoRaw = (adiamentoRes.data as { adiado_ate: string } | null)?.adiado_ate ?? null

  const decisao = decidirLembreteMeta({
    metaCadastrada: metaEstaCadastrada(meta, individuais),
    barbeirosAtivos: Number(barbeirosRes.count) || 0,
    modoDoCiclo: (modoRes.data as { modo: string } | null)?.modo ?? 'metas',
    cicloFechado: trava.fechado,
    adiadoAte: adiadoRaw ? new Date(adiadoRaw) : null,
    agora: new Date(),
  })

  if (!decisao.mostrar) return null

  // Dias do ciclo já corridos e o que resta, na mesma régua que o dashboard
  // usa — data local de São Paulo comparada com as bordas do ciclo.
  const hoje = new Date()
  const hojeBr = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  hojeBr.setHours(0, 0, 0, 0)
  const inicio = new Date(ciclo.inicio); inicio.setHours(0, 0, 0, 0)
  const fim = new Date(ciclo.fim); fim.setHours(0, 0, 0, 0)
  const dia = 86_400_000
  const decorridos = Math.max(0, Math.floor((hojeBr.getTime() - inicio.getTime()) / dia) + 1)
  const restantes = Math.max(0, Math.floor((fim.getTime() - hojeBr.getTime()) / dia) + 1)

  const texto = textoLembrete(
    urgenciaDoCiclo(decorridos, ciclo.totalDias),
    ciclo.label,
    restantes,
  )

  return { ...texto, mes, ano, cicloLabel: ciclo.label, diasRestantes: restantes }
}
