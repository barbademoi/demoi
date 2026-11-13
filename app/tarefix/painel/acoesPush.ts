'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'
import { chavesVapid, enviar, inscricoesDosDonos, PUSH_PADRAO, type TipoPush } from '@/lib/tarefix/push'
import { apagarInscricao, gravarInscricao, type InscricaoNavegador } from '@/lib/tarefix/pushInscricao'

export async function chavePushDono(): Promise<{ ok: true; chave: string } | { ok: false; erro: string }> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { publica } = await chavesVapid()
  return { ok: true, chave: publica }
}

export async function ativarPushDono(inscricao: InscricaoNavegador, navegador: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  return gravarInscricao({ empresa_id: s.empresa.id, dono_id: s.dono.id }, inscricao, navegador)
}

export async function desativarPushDono(endpoint: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  await apagarInscricao(endpoint, { dono_id: s.dono.id })
  return { ok: true }
}

/** Liga/desliga cada tipo de aviso da empresa. */
export async function salvarTiposPush(tipos: Partial<Record<TipoPush, boolean>>): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const limpo = Object.fromEntries(Object.keys(PUSH_PADRAO).map((k) => [k, Boolean(tipos?.[k as TipoPush])]))
  const { error } = await s.db.from('empresas').update({ push_tipos: limpo }).eq('id', s.empresa.id)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

/** Manda uma notificação de teste para os aparelhos do dono. */
export async function testarPushDono(): Promise<{ ok: true; enviados: number } | { ok: false; erro: string }> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const inscricoes = (await inscricoesDosDonos(s.empresa.id)).filter(Boolean)
  const enviados = await enviar(inscricoes, { titulo: 'Tarefix', corpo: 'Notificações funcionando neste aparelho.', url: '/tarefix/painel', tag: 'teste' })
  if (!enviados) return { ok: false, erro: 'Nenhum aparelho recebeu. Ative as notificações neste aparelho primeiro.' }
  return { ok: true, enviados }
}
