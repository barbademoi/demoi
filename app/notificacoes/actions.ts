'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * INSCRIÇÃO E CANCELAMENTO DAS NOTIFICAÇÕES.
 *
 * O navegador cria a inscrição (endpoint + chaves) e manda pra cá. Quem grava
 * é o servidor, com service_role — as tabelas de push têm RLS ligada e nenhuma
 * policy, então não há caminho de insert direto pelo cliente. Isso é de
 * propósito: `endpoint`, `p256dh` e `auth` juntos permitem MANDAR notificação
 * pro aparelho de alguém, e não é dado que se deixa um cliente escrever.
 *
 * ── DOIS CAMINHOS, DUAS PROVAS ──────────────────────────────────────────────
 * O dono prova quem é pela sessão. O barbeiro não tem conta: ele prova pelo
 * `link_codigo`, o mesmo token que já dá acesso à tela dele. Quem tem o link
 * já vê os números do barbeiro; poder receber notificação deles não aumenta o
 * que a posse do link permite.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export interface DadosInscricao {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}

export type ResultadoInscricao = { ok?: true; error?: string }

function valida(d: DadosInscricao): string | null {
  if (!d?.endpoint || !/^https:\/\//.test(d.endpoint)) return 'Inscrição inválida.'
  if (d.endpoint.length > 2000) return 'Inscrição inválida.'
  if (!d.p256dh || !d.auth) return 'Inscrição incompleta.'
  return null
}

/** Grava a inscrição do DONO logado. */
export async function inscreverDono(d: DadosInscricao): Promise<ResultadoInscricao> {
  const erro = valida(d)
  if (erro) return { error: erro }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Entre de novo.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).maybeSingle()
  const barbeariaId = (usuario as { barbearia_id?: string } | null)?.barbearia_id
  if (!barbeariaId) return { error: 'Conta sem barbearia.' }

  const admin: Admin = createAdminClient()
  // O endpoint é único: reinscrever o mesmo aparelho ATUALIZA em vez de
  // duplicar. Acontece toda vez que a pessoa clica em "ativar" de novo, e sem
  // isso ela receberia duas notificações iguais pra sempre.
  const { error } = await admin.from('push_inscricoes').upsert({
    barbearia_id: barbeariaId,
    usuario_id: user.id,
    barbeiro_id: null,
    endpoint: d.endpoint,
    p256dh: d.p256dh,
    auth: d.auth,
    user_agent: (d.userAgent ?? '').slice(0, 300) || null,
    falhas: 0,
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[push] erro ao inscrever o dono:', error)
    return { error: 'Não deu pra ativar agora. Tente de novo.' }
  }
  return { ok: true }
}

/** Grava a inscrição de um BARBEIRO, provada pelo link dele. */
export async function inscreverBarbeiro(
  linkCodigo: string,
  d: DadosInscricao,
): Promise<ResultadoInscricao> {
  const erro = valida(d)
  if (erro) return { error: erro }
  if (!linkCodigo) return { error: 'Link inválido.' }

  const admin: Admin = createAdminClient()
  const { data: barbeiro } = await admin
    .from('barbeiros').select('id, barbearia_id, ativo')
    .eq('link_codigo', linkCodigo).maybeSingle()

  const b = barbeiro as { id: string; barbearia_id: string; ativo: boolean } | null
  if (!b || !b.ativo) return { error: 'Link inválido.' }

  const { error } = await admin.from('push_inscricoes').upsert({
    barbearia_id: b.barbearia_id,
    usuario_id: null,
    barbeiro_id: b.id,
    endpoint: d.endpoint,
    p256dh: d.p256dh,
    auth: d.auth,
    user_agent: (d.userAgent ?? '').slice(0, 300) || null,
    falhas: 0,
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[push] erro ao inscrever o barbeiro:', error)
    return { error: 'Não deu pra ativar agora. Tente de novo.' }
  }
  return { ok: true }
}

/**
 * Apaga a inscrição de UM aparelho.
 *
 * Não pede prova de quem é: o endpoint já é o segredo. Quem o tem, tem o
 * aparelho — e desligar o próprio aviso é a ação mais inofensiva do sistema.
 * Exigir sessão aqui quebraria o cancelamento do barbeiro, que não tem conta.
 */
export async function cancelarInscricao(endpoint: string): Promise<ResultadoInscricao> {
  if (!endpoint) return { error: 'Inscrição inválida.' }
  const admin: Admin = createAdminClient()
  const { error } = await admin.from('push_inscricoes').delete().eq('endpoint', endpoint)
  if (error) {
    console.error('[push] erro ao cancelar:', error)
    return { error: 'Não deu pra desativar agora.' }
  }
  return { ok: true }
}
