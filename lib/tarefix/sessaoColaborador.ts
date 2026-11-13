import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { segredoSessao } from '@/lib/tarefix/segredo'
import type { Colaborador, Empresa } from '@/lib/tarefix/tipos'

/**
 * Acesso do COLABORADOR: link /tarefix/c/[token] + PIN.
 *
 * Depois do PIN certo, gravamos um cookie httpOnly assinado (HMAC), válido
 * por 30 dias, com caminho restrito ao próprio link — num mesmo aparelho
 * cada colaborador tem a sua sessão.
 *
 * O cookie carrega uma "impressão" de token + hash do PIN: gerar link novo
 * ou trocar o PIN derruba as sessões abertas na hora.
 */

const NOME_COOKIE = 'tfx_sessao'
export const DURACAO_SESSAO_S = 30 * 24 * 60 * 60

function impressao(c: Pick<Colaborador, 'token_acesso' | 'pin_hash'>) {
  return createHash('sha256').update(`${c.token_acesso}:${c.pin_hash ?? ''}`).digest('hex').slice(0, 24)
}

function assinar(payload: string) {
  return createHmac('sha256', segredoSessao()).update(payload).digest('base64url')
}

export function caminhoCookie(token: string) {
  return `/tarefix/c/${token}`
}

export function gravarSessao(c: Colaborador) {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_S
  const payload = `${c.id}.${exp}.${impressao(c)}`
  cookies().set(NOME_COOKIE, `${payload}.${assinar(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: caminhoCookie(c.token_acesso),
    maxAge: DURACAO_SESSAO_S,
  })
}

function sessaoValida(c: Colaborador): boolean {
  const valor = cookies().get(NOME_COOKIE)?.value
  if (!valor) return false
  const partes = valor.split('.')
  if (partes.length !== 4) return false
  const [id, exp, imp, assinatura] = partes
  const esperado = Buffer.from(assinar(`${id}.${exp}.${imp}`))
  const recebido = Buffer.from(assinatura)
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return false
  if (id !== c.id) return false
  if (Number(exp) < Date.now() / 1000) return false
  return imp === impressao(c)
}

export type AcessoColaborador =
  | { estado: 'invalido' }
  | { estado: 'pin'; colaborador: Colaborador; empresa: Empresa }
  | { estado: 'ok'; colaborador: Colaborador; empresa: Empresa; funcao: string | null }

/** Valida o token (e o cookie do PIN). Sempre com service role, filtrando à mão. */
export async function carregarAcesso(token: string): Promise<AcessoColaborador> {
  if (!/^[a-f0-9]{32,128}$/i.test(token)) return { estado: 'invalido' }
  const db = createTarefixAdmin()
  const { data: c } = await db.from('colaboradores').select('*').eq('token_acesso', token).maybeSingle()
  if (!c || !c.ativo) return { estado: 'invalido' }
  const { data: empresa } = await db.from('empresas').select('*').eq('id', c.empresa_id).single()
  if (!empresa || empresa.ativo === false) return { estado: 'invalido' } // empresa suspensa: links param
  if (!sessaoValida(c as Colaborador)) return { estado: 'pin', colaborador: c as Colaborador, empresa: empresa as Empresa }
  let funcao: string | null = null
  if (c.funcao_id) {
    const { data: f } = await db.from('funcoes').select('nome').eq('id', c.funcao_id).maybeSingle()
    funcao = f?.nome ?? null
  }
  return { estado: 'ok', colaborador: c as Colaborador, empresa: empresa as Empresa, funcao }
}
