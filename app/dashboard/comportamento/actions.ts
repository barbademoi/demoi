'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Todas as ações abaixo são EXCLUSIVAS DO DONO. A leitura/escrita passa pelo
// client autenticado (anon key + sessão) e a RLS (barbearia_id =
// get_barbearia_id()) garante o isolamento por barbearia. Filtramos também
// por barbearia_id na mão como defesa em profundidade.
async function getBarbeariaId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  return (data as { barbearia_id: string } | null)?.barbearia_id ?? null
}

function parseValor(raw: FormDataEntryValue | null): number {
  const n = parseFloat(String(raw ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

// ── Toggle geral do módulo (default OFF) ─────────────────────────────────────
export async function toggleComportamento(ativo: boolean) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update({ comportamento_ativo: ativo }).eq('id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

// ── Regras de conduta ────────────────────────────────────────────────────────
export async function criarRegra(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const nome = (formData.get('nome') as string ?? '').trim().slice(0, 80)
  const valor = parseValor(formData.get('valor'))
  if (!nome) return { error: 'Dê um nome pra regra.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .insert({ barbearia_id: barbeariaId, nome, valor, ativo: true })
  if (error) return { error: 'Erro ao criar regra.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

export async function atualizarRegra(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string ?? '').trim().slice(0, 80)
  const valor = parseValor(formData.get('valor'))
  if (!id || !nome) return { error: 'Dados inválidos.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .update({ nome, valor })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

export async function toggleRegraAtiva(id: string, ativo: boolean) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .update({ ativo })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

export async function excluirRegra(id: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .delete()
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao excluir.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}
