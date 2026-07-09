'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { estaFechado } from '@/lib/mesFechado'
import type { MetaIndividual } from '@/types/database'

/**
 * Busca as metas (coletiva + individuais) de um período específico.
 * Usado pelo seletor de meses/ciclos futuros no MetasModal — quando o
 * dono navega pra outro período, re-preenche os campos com o que já
 * existe (ou vazio, se ainda não configurado).
 */
export async function buscarMetasPeriodo(mes: number, ano: number): Promise<{
  metaColetiva: number
  metaColetivaBronze: number
  metaColetivaPrata: number
  premioColetivo: string
  premioColetivoBronze: string
  premioColetivoPrata: string
  faturamentoAcumulado: number
  metasIndividuais: MetaIndividual[]
  existe: boolean
} | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meta } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata, premio_coletivo, premio_coletivo_bronze, premio_coletivo_prata, faturamento_acumulado')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle() as { data: {
      id: string
      meta_coletiva: number; meta_coletiva_bronze: number; meta_coletiva_prata: number
      premio_coletivo: string | null; premio_coletivo_bronze: string | null; premio_coletivo_prata: string | null
      faturamento_acumulado: number
    } | null }

  if (!meta) {
    return {
      metaColetiva: 0, metaColetivaBronze: 0, metaColetivaPrata: 0,
      premioColetivo: '', premioColetivoBronze: '', premioColetivoPrata: '',
      faturamentoAcumulado: 0, metasIndividuais: [], existe: false,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: indsRaw } = await (supabase as any)
    .from('metas_individuais').select('*').eq('meta_id', meta.id)

  return {
    metaColetiva: Number(meta.meta_coletiva) || 0,
    metaColetivaBronze: Number(meta.meta_coletiva_bronze) || 0,
    metaColetivaPrata: Number(meta.meta_coletiva_prata) || 0,
    premioColetivo: meta.premio_coletivo ?? '',
    premioColetivoBronze: meta.premio_coletivo_bronze ?? '',
    premioColetivoPrata: meta.premio_coletivo_prata ?? '',
    faturamentoAcumulado: Number(meta.faturamento_acumulado) || 0,
    metasIndividuais: (indsRaw ?? []) as MetaIndividual[],
    existe: true,
  }
}

/**
 * Busca a meta mais recente anterior ao período (mes, ano) informado.
 * Usado pelo botão "Copiar metas de <mês>" no MetasModal quando o dono
 * navega pra um período futuro que ainda não tem metas configuradas.
 * Devolve `{ existe: false }` se não houver nenhuma meta anterior.
 */
export async function buscarMetasMaisRecenteAntes(mes: number, ano: number): Promise<
  | {
      existe: true
      mesOrigem: number
      anoOrigem: number
      metaColetiva: number
      premioColetivo: string
      metasIndividuais: MetaIndividual[]
    }
  | { existe: false }
  | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  // Volume é pequeno (≤12 por ano), então filtrar em JS sai mais simples e
  // seguro do que montar um OR composto no PostgREST.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: todas } = await (supabase as any)
    .from('metas')
    .select('id, mes, ano, meta_coletiva, premio_coletivo')
    .eq('barbearia_id', usuario.barbearia_id)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false }) as {
      data: Array<{ id: string; mes: number; ano: number; meta_coletiva: number; premio_coletivo: string | null }> | null
    }

  const meta = (todas ?? []).find(m => m.ano < ano || (m.ano === ano && m.mes < mes))
  if (!meta) return { existe: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: indsRaw } = await (supabase as any)
    .from('metas_individuais').select('*').eq('meta_id', meta.id)

  return {
    existe: true,
    mesOrigem: meta.mes,
    anoOrigem: meta.ano,
    metaColetiva: Number(meta.meta_coletiva) || 0,
    premioColetivo: meta.premio_coletivo ?? '',
    metasIndividuais: (indsRaw ?? []) as MetaIndividual[],
  }
}

export async function salvarMetas(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string } | null }

  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const mes = parseInt(formData.get('mes') as string)
  const ano = parseInt(formData.get('ano') as string)

  // Trava de mês fechado
  const trava = await estaFechado(supabase, usuario.barbearia_id, mes, ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de editar.' }

  // Base da meta (modo) — setting global da barbearia. Mora aqui, junto da
  // definição dos valores de meta. Só grava quando vier no form (defensivo).
  const modoMetaRaw = formData.get('modo_meta') as string | null
  if (modoMetaRaw != null) {
    const modo_meta = (['faturamento', 'comissao', 'ambos'].includes(modoMetaRaw) ? modoMetaRaw : 'comissao')
    const baseMetaRaw = (formData.get('base_meta') as string) || modo_meta
    // base_meta só faz sentido quando modo=ambos. Nos modos simples, espelha o próprio modo.
    const base_meta = modo_meta === 'ambos'
      ? (['faturamento', 'comissao'].includes(baseMetaRaw) ? baseMetaRaw : 'comissao')
      : (modo_meta as 'faturamento' | 'comissao')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('barbearias')
      .update({ modo_meta, base_meta })
      .eq('id', usuario.barbearia_id)
  }

  const meta_coletiva = parseFloat(formData.get('meta_coletiva') as string) || 0
  const meta_coletiva_bronze = parseFloat(formData.get('meta_coletiva_bronze') as string) || 0
  const meta_coletiva_prata = parseFloat(formData.get('meta_coletiva_prata') as string) || 0
  const premio_coletivo = formData.get('premio_coletivo') as string
  const premio_coletivo_bronze = (formData.get('premio_coletivo_bronze') as string) || ''
  const premio_coletivo_prata = (formData.get('premio_coletivo_prata') as string) || ''
  const faturamento_acumulado = parseFloat(formData.get('faturamento_acumulado') as string) || 0

  const colsColetivas = {
    meta_coletiva,
    meta_coletiva_bronze,
    meta_coletiva_prata,
    premio_coletivo: premio_coletivo || null,
    premio_coletivo_bronze: premio_coletivo_bronze || null,
    premio_coletivo_prata: premio_coletivo_prata || null,
    faturamento_acumulado,
  }

  // Upsert meta coletiva
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingMeta } = await (supabase as any)
    .from('metas')
    .select('id')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  let meta_id: string

  if (existingMeta) {
    meta_id = (existingMeta as { id: string }).id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('metas')
      .update(colsColetivas)
      .eq('id', meta_id)
    if (error) return { error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newMeta, error } = await (supabase as any)
      .from('metas')
      .insert({ barbearia_id: usuario.barbearia_id, mes, ano, ...colsColetivas })
      .select('id')
      .single()
    if (error) return { error: error.message }
    meta_id = (newMeta as { id: string }).id
  }

  const barbeiros = JSON.parse(formData.get('barbeiros') as string) as {
    id: string
    bronze_comm: number
    prata_comm: number
    ouro_comm: number
    bronze_premio: string
    prata_premio: string
    ouro_premio: string
  }[]

  let salvos = 0
  const erros: string[] = []

  for (const b of barbeiros) {
    // Check if meta individual already exists (ignore error — means "not found")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('metas_individuais')
      .select('id')
      .eq('meta_id', meta_id)
      .eq('barbeiro_id', b.id)
      .maybeSingle()

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('metas_individuais')
        .update({ bronze_comm: b.bronze_comm, prata_comm: b.prata_comm, ouro_comm: b.ouro_comm })
        .eq('id', (existing as { id: string }).id)
      if (error) { erros.push(`Atualizar ${b.id}: ${error.message}`); continue }

      // Prize columns (silently ignore if not in DB yet)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('metas_individuais')
        .update({ bronze_premio: b.bronze_premio || null, prata_premio: b.prata_premio || null, ouro_premio: b.ouro_premio || null })
        .eq('id', (existing as { id: string }).id)

      salvos++
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await (supabase as any)
        .from('metas_individuais')
        .insert({ meta_id, barbeiro_id: b.id, bronze_comm: b.bronze_comm, prata_comm: b.prata_comm, ouro_comm: b.ouro_comm })
        .select('id')
        .single()
      if (error) { erros.push(`Inserir ${b.id}: ${error.message}`); continue }

      // Prize columns after insert
      if (inserted && (b.bronze_premio || b.prata_premio || b.ouro_premio)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('metas_individuais')
          .update({ bronze_premio: b.bronze_premio || null, prata_premio: b.prata_premio || null, ouro_premio: b.ouro_premio || null })
          .eq('id', (inserted as { id: string }).id)
      }
      salvos++
    }
  }

  if (erros.length > 0 && salvos === 0) {
    return { error: erros[0] }
  }

  revalidatePath('/dashboard')
  revalidatePath('/cards')
  revalidatePath('/configuracoes')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true, salvos, erros: erros.length > 0 ? erros : undefined }
}
