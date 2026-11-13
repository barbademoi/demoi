import { redirect } from 'next/navigation'
import { createTarefixServer } from '@/lib/tarefix/supabase/server'
import type { Dono, Empresa } from '@/lib/tarefix/tipos'

export type SessaoDono = {
  db: ReturnType<typeof createTarefixServer>
  userId: string
  dono: Dono
  empresa: Empresa
}

/**
 * Sessão do dono (Supabase Auth — a mesma do BarberMeta) com cadastro em tarefix.donos.
 * Retorna o cliente com RLS: tudo que ele lê/grava fica restrito à empresa do dono.
 */
export async function sessaoDono(): Promise<SessaoDono | 'sem-login' | 'sem-acesso' | 'suspenso'> {
  const db = createTarefixServer()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return 'sem-login'
  const { data: dono } = await db.from('donos').select('*').eq('id', user.id).maybeSingle()
  if (!dono) return 'sem-acesso'
  const { data: empresa } = await db.from('empresas').select('*').eq('id', dono.empresa_id).single()
  if (!empresa) return 'sem-acesso'
  if (empresa.ativo === false) return 'suspenso' // acesso suspenso pelo admin
  return { db, userId: user.id, dono: dono as Dono, empresa: empresa as Empresa }
}

/** Para páginas do painel. Sem login → /tarefix/entrar. Sem cadastro de dono → /tarefix/sem-acesso. */
export async function exigirDono(): Promise<SessaoDono> {
  const s = await sessaoDono()
  if (s === 'sem-login') redirect('/tarefix/entrar')
  if (s === 'sem-acesso') redirect('/tarefix/sem-acesso')
  if (s === 'suspenso') redirect('/tarefix/sem-acesso?motivo=suspenso')
  return s
}

export type Resultado = { ok: true } | { ok: false; erro: string }

/** Para server actions: devolve a sessão ou um erro amigável (sem redirect). */
export async function donoOuErro(): Promise<SessaoDono | { ok: false; erro: string }> {
  const s = await sessaoDono()
  if (s === 'sem-login') return { ok: false, erro: 'Sua sessão expirou. Entre de novo.' }
  if (s === 'sem-acesso') return { ok: false, erro: 'Sem acesso ao Tarefix.' }
  if (s === 'suspenso') return { ok: false, erro: 'Seu acesso ao Tarefix está suspenso.' }
  return s
}

/** Traduz erros do Postgres/Supabase para algo legível. */
export function mensagemErro(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return 'Erro desconhecido.'
  if (e.code === 'P0001' && e.message) return e.message // nossos raise exception (ex.: mês fechado)
  if (e.code === '23505') return 'Já existe um registro igual.'
  if (e.code === '42501') return 'Sem permissão para isso.'
  return e.message || 'Erro desconhecido.'
}

export function falha(e: { message?: string; code?: string } | null | undefined): Resultado {
  return { ok: false, erro: mensagemErro(e) }
}
