'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { gerarLinkCodigo } from '@/lib/utils'

export async function criarBarbeiro(formData: FormData) {
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

  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome obrigatório.' }

  const foto_url = (formData.get('foto_url') as string) || null
  const tipo = (formData.get('tipo') as string) === 'recepcionista' ? 'recepcionista' : 'barbeiro'

  let link_codigo = ''
  for (let i = 0; i < 5; i++) {
    const candidato = gerarLinkCodigo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existe } = await (supabase as any)
      .from('barbeiros')
      .select('id')
      .eq('link_codigo', candidato)
      .single()
    if (!existe) { link_codigo = candidato; break }
  }
  if (!link_codigo) return { error: 'Tente novamente.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbeiros')
    .insert({ barbearia_id: usuario.barbearia_id, nome, link_codigo, foto_url, tipo })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { link_codigo }
}

export async function atualizarBarbeiro(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string)?.trim()
  const foto_url = (formData.get('foto_url') as string) || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbeiros')
    .update({ nome, foto_url })
    .eq('id', id)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function atualizarLogo(formData: FormData) {
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

  const logo_url = formData.get('logo_url') as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias')
    .update({ logo_url })
    .eq('id', usuario.barbearia_id)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function atualizarFaturamento(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const meta_id = formData.get('meta_id') as string
  const faturamento_acumulado = parseFloat(formData.get('faturamento_acumulado') as string) || 0

  // Campo opcional. Quando ausente, preserva valor existente.
  const atendimentosRaw = formData.get('numero_atendimentos') as string | null
  const atendimentosInformados = atendimentosRaw !== null && atendimentosRaw !== ''
  const numero_atendimentos = atendimentosInformados ? Math.max(0, parseInt(atendimentosRaw) || 0) : null

  const payload: Record<string, unknown> = { faturamento_acumulado }
  if (numero_atendimentos !== null) payload.numero_atendimentos = numero_atendimentos

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('metas')
    .update(payload)
    .eq('id', meta_id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function lancarComissao(formData: FormData) {
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

  const barbeiro_id = formData.get('barbeiro_id') as string
  const comissao_acumulada = parseFloat(formData.get('comissao_acumulada') as string)
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  if (isNaN(comissao_acumulada) || comissao_acumulada < 0) {
    return { error: 'Valor inválido.' }
  }

  // Campo opcional — só enviado pelo modo autônomo. Quando ausente, preserva valor existente.
  const atendimentosRaw = formData.get('numero_atendimentos') as string | null
  const atendimentosInformados = atendimentosRaw !== null && atendimentosRaw !== ''
  const numero_atendimentos = atendimentosInformados ? Math.max(0, parseInt(atendimentosRaw) || 0) : null

  const payload: Record<string, unknown> = {
    barbearia_id: usuario.barbearia_id,
    barbeiro_id,
    mes,
    ano,
    comissao_acumulada,
    modo: 'direto',
  }
  if (numero_atendimentos !== null) payload.numero_atendimentos = numero_atendimentos

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lancamentos')
    .upsert(payload, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}
