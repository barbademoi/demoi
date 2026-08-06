'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { emailTemReuniao } from '@/lib/reuniao/preview'
import { gerarRaioXReuniao } from '@/lib/reuniao/raioX'
import { montarPautaReuniao } from '@/lib/reuniao/frases'

// Resolve o dono autenticado E confere acesso ao módulo (allowlist preview).
// Retorna barbearia_id só se o e-mail estiver liberado. Trava REAL no servidor.
type Acesso =
  | { ok: false; error: string }
  | { ok: true; supabase: ReturnType<typeof createClient>; barbeariaId: string }

async function donoComAcesso(): Promise<Acesso> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }
  if (!emailTemReuniao(user.email ?? null)) return { ok: false, error: 'Sem acesso ao módulo de Reunião.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  const barbeariaId = (data as { barbearia_id: string } | null)?.barbearia_id
  if (!barbeariaId) return { ok: false, error: 'Barbearia não encontrada.' }
  return { ok: true, supabase, barbeariaId }
}

/**
 * PAUTA DA REUNIÃO — montada por TEMPLATE, sem IA.
 *
 * Os números vêm todos do raio-x (que já os apura); aqui só se escreve o texto
 * em cima deles, via lib/reuniao/frases.ts. Nenhuma chamada externa: o mesmo
 * conjunto de números produz sempre a mesma pauta, e a geração não depende de
 * crédito, chave nem rede. Só leitura.
 */
export async function gerarPautaReuniao(): Promise<{ texto: string } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }

  const rx = await gerarRaioXReuniao(acesso.supabase, acesso.barbeariaId)
  if (rx.barbeiros.length === 0) {
    return { error: 'Sem dados da equipe neste período pra montar a pauta.' }
  }

  const texto = montarPautaReuniao(rx)
  if (!texto.trim()) return { error: 'Sem dados suficientes pra montar a pauta.' }
  return { texto }
}

// ── Anotações / checklist ────────────────────────────────────────────────
export interface NotaReuniao {
  id: string
  texto: string
  feito: boolean
  ordem: number
}

// Erro amigável quando a tabela ainda não foi criada (migration 037 pendente).
function semTabela(err: unknown): boolean {
  const msg = (err as { message?: string } | null)?.message ?? String(err ?? '')
  return /reuniao_notas|does not exist|relation .* does not exist|schema cache/i.test(msg)
}

export async function criarNota(texto: string): Promise<{ nota: NotaReuniao } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  const limpo = texto.trim().slice(0, 500)
  if (!limpo) return { error: 'Escreva algo na anotação.' }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (acesso.supabase as any)
      .from('reuniao_notas')
      .insert({ barbearia_id: acesso.barbeariaId, texto: limpo, feito: false, ordem: Date.now() % 2_000_000_000 })
      .select('id, texto, feito, ordem')
      .single()
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { nota: data as NotaReuniao }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[criarNota] erro:', err)
    return { error: 'Erro ao salvar a anotação.' }
  }
}

export async function atualizarNota(
  id: string,
  patch: { texto?: string; feito?: boolean },
): Promise<{ ok: true } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof patch.texto === 'string') {
    const limpo = patch.texto.trim().slice(0, 500)
    if (!limpo) return { error: 'A anotação não pode ficar vazia.' }
    updates.texto = limpo
  }
  if (typeof patch.feito === 'boolean') updates.feito = patch.feito
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (acesso.supabase as any)
      .from('reuniao_notas').update(updates)
      .eq('id', id).eq('barbearia_id', acesso.barbeariaId)
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { ok: true }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[atualizarNota] erro:', err)
    return { error: 'Erro ao salvar.' }
  }
}

export async function removerNota(id: string): Promise<{ ok: true } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (acesso.supabase as any)
      .from('reuniao_notas').delete()
      .eq('id', id).eq('barbearia_id', acesso.barbeariaId)
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { ok: true }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[removerNota] erro:', err)
    return { error: 'Erro ao remover.' }
  }
}
