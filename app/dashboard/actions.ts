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
    .insert({ barbearia_id: usuario.barbearia_id, nome, link_codigo })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { link_codigo }
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
  const modo = (formData.get('modo') as string) || 'direto'
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  if (isNaN(comissao_acumulada) || comissao_acumulada < 0) {
    return { error: 'Valor inválido.' }
  }

  const payload = {
    barbearia_id: usuario.barbearia_id,
    barbeiro_id,
    mes,
    ano,
    comissao_acumulada,
    modo,
    ...(modo === 'calculado' ? {
      faturamento:     parseFloat(formData.get('faturamento') as string) || null,
      perc_assinatura: parseFloat(formData.get('perc_assinatura') as string) || null,
      perc_servico:    parseFloat(formData.get('perc_servico') as string) || null,
      perc_produto:    parseFloat(formData.get('perc_produto') as string) || null,
    } : {}),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lancamentos')
    .upsert(payload, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}
