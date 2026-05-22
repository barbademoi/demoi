'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ServicoLancado { servico_id: string; quantidade: number }

/**
 * Confere se o dono logado pode mexer no barbeiro alvo (mesma barbearia).
 * Retorna `{ barbeariaId, barbeiroId }` ou `{ error }`.
 */
async function autorizarDono(barbeiroId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros').select('barbearia_id, link_codigo').eq('id', barbeiroId).single() as
    { data: { barbearia_id: string; link_codigo: string } | null }
  if (!barbeiro) return { error: 'Barbeiro não encontrado.' as const }
  if (barbeiro.barbearia_id !== usuario.barbearia_id) return { error: 'Sem permissão.' as const }

  return { supabase, barbeariaId: usuario.barbearia_id, linkCodigo: barbeiro.link_codigo }
}

/**
 * Lança ou edita os serviços de um dia inteiro pra um barbeiro, agindo como dono.
 * Pra cada serviço:
 *   - quantidade > 0 e registro novo → INSERT (lancado_por='dono')
 *   - quantidade > 0 e registro existe → UPDATE (editado_por='dono', editado_em=now())
 *   - quantidade = 0 → DELETE
 *
 * Preserva o lancado_por original quando edita (mantém quem criou).
 */
export async function lancarDiaComoDono(params: {
  barbeiroId: string
  data: string            // 'YYYY-MM-DD'
  servicos: ServicoLancado[]
}) {
  const auth = await autorizarDono(params.barbeiroId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId, linkCodigo } = auth

  const d = new Date(params.data + 'T12:00:00')
  const mes = d.getMonth() + 1
  const ano = d.getFullYear()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campRaw } = await (supabase as any)
    .from('campanha').select('id, ativo')
    .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle() as
    { data: { id: string; ativo: boolean } | null }
  if (!campRaw) return { error: 'Campanha não encontrada para este mês.' }
  if (campRaw.ativo === false) return { error: 'Campanha inativa neste mês.' }

  const campanha_id = campRaw.id
  const agora = new Date().toISOString()

  // Busca o que já existe pra esse dia/barbeiro (pra saber INSERT vs UPDATE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existRaw } = await (supabase as any)
    .from('controle_diario')
    .select('id, servico_id')
    .eq('barbeiro_id', params.barbeiroId)
    .eq('data', params.data)
  const existePorServico = new Map<string, string>()
  for (const r of (existRaw ?? []) as { id: string; servico_id: string }[]) {
    existePorServico.set(r.servico_id, r.id)
  }

  for (const s of params.servicos) {
    const idExistente = existePorServico.get(s.servico_id)

    if (s.quantidade <= 0) {
      if (idExistente) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('controle_diario').delete().eq('id', idExistente)
      }
      continue
    }

    if (idExistente) {
      // UPDATE — preserva lancado_por original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .update({
          quantidade: s.quantidade,
          editado_por: 'dono',
          editado_em: agora,
        })
        .eq('id', idExistente)
    } else {
      // INSERT — dono criou
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .insert({
          barbeiro_id: params.barbeiroId,
          campanha_id,
          data: params.data,
          servico_id: s.servico_id,
          quantidade: s.quantidade,
          lancado_por: 'dono',
        })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/b/${linkCodigo}`)
  return { ok: true }
}

/**
 * Apaga TODOS os lançamentos de um barbeiro num dia.
 * Usado pelo botão ✕ ao lado do total do dia.
 */
export async function excluirLancamentoDia(barbeiroId: string, data: string) {
  const auth = await autorizarDono(barbeiroId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, linkCodigo } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('controle_diario')
    .delete()
    .eq('barbeiro_id', barbeiroId)
    .eq('data', data)

  revalidatePath('/dashboard')
  revalidatePath(`/b/${linkCodigo}`)
  return { ok: true }
}
