'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { estaFechado } from '@/lib/mesFechado'
import type { ModoPontos } from '@/types/database'

export async function salvarModoMes(modo: ModoPontos, mes: number, ano: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const trava = await estaFechado(supabase, usuario.barbearia_id, mes, ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de editar.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('modo_mes')
    .upsert({ barbearia_id: usuario.barbearia_id, mes, ano, modo }, { onConflict: 'barbearia_id,mes,ano' })

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/dashboard')
  return { ok: true }
}

interface ServicoInput { id?: string; emoji: string; nome: string; pontos: number; contaComoAssinatura?: boolean }
interface PremioInput { posicao: number; valor: number }

export async function salvarCampanha(params: {
  mes: number
  ano: number
  minPontos: number
  minPontosRecep: number
  bonusAssinQtd: number
  bonusAssinValor: number
  regrasPersonalizadas?: string
  servicos: ServicoInput[]
  premios: PremioInput[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const trava = await estaFechado(supabase, usuario.barbearia_id, params.mes, params.ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de editar.' }

  // Upsert campanha
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campData, error: cErr } = await (supabase as any)
    .from('campanha')
    .upsert({
      barbearia_id: usuario.barbearia_id,
      mes: params.mes,
      ano: params.ano,
      min_pontos: params.minPontos,
      min_pontos_recep: params.minPontosRecep,
      bonus_assin_qtd: params.bonusAssinQtd,
      bonus_assin_valor: params.bonusAssinValor,
      regras_personalizadas: params.regrasPersonalizadas?.trim() || null,
    }, { onConflict: 'barbearia_id,mes,ano' })
    .select('id')
    .single()

  if (cErr) return { error: (cErr as { message: string }).message }
  const campanha_id = (campData as { id: string }).id

  // Services: keep existing with IDs, insert new, delete removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingS } = await (supabase as any)
    .from('campanha_servicos').select('id').eq('campanha_id', campanha_id)
  const existingIds: string[] = (existingS ?? []).map((s: { id: string }) => s.id)
  const incomingIds = params.servicos.filter(s => s.id).map(s => s.id!)
  const toDelete = existingIds.filter(id => !incomingIds.includes(id))

  if (toDelete.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('campanha_servicos').delete().in('id', toDelete)
  }
  for (const s of params.servicos) {
    const conta_como_assinatura = !!s.contaComoAssinatura
    if (s.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('campanha_servicos')
        .update({ emoji: s.emoji, nome: s.nome, pontos: s.pontos, conta_como_assinatura }).eq('id', s.id)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('campanha_servicos')
        .insert({ campanha_id, emoji: s.emoji, nome: s.nome, pontos: s.pontos, conta_como_assinatura })
    }
  }

  // Prizes: replace all (no foreign key constraints from controle_diario to premios)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('campanha_premios').delete().eq('campanha_id', campanha_id)
  if (params.premios.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('campanha_premios').insert(
      params.premios.map(p => ({ campanha_id, posicao: p.posicao, valor: p.valor }))
    )
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Salva as Regras gerais da campanha (lista editavel pelo dono — aba Regras
 * do CampanhaModal). Persiste no nivel da BARBEARIA porque as regras valem
 * pra todos os ciclos, nao por mes especifico.
 *
 * Aceita:
 *   - array de strings: substitui tudo. Vazio ([]) eh respeitado — quer
 *     dizer "nao ha regras gerais nessa barbearia". Default volta com
 *     `resetarRegrasGerais` (NULL no banco).
 */
export async function salvarRegrasGerais(regras: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const limpas = regras
    .map(r => r.trim())
    .filter(r => r.length > 0)
    .map(r => r.slice(0, 500))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update({ regras_gerais: limpas })
    .eq('id', usuario.barbearia_id)
  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true as const }
}

/**
 * Volta as regras gerais ao default do sistema (NULL no banco, exibe
 * REGRAS_FIXAS de lib/regras.ts).
 */
export async function resetarRegrasGerais() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update({ regras_gerais: null })
    .eq('id', usuario.barbearia_id)
  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true as const }
}

export async function toggleCampanhaAtivo(campanhaId: string, ativo: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('campanha').update({ ativo }).eq('id', campanhaId)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/dashboard')
  return { ok: true }
}
