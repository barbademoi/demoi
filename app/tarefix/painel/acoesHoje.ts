'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'

// Todas usam o cliente com RLS do dono: só alcançam a própria empresa.
// O gatilho do banco impede mexer em mês já fechado.

const MAX_MOTIVO = 140

export async function reprovarTarefa(id: string, motivo: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const texto = motivo.trim().slice(0, MAX_MOTIVO)
  if (!texto) return { ok: false, erro: 'Escreva o motivo (o colaborador vai ver).' }
  const { data, error } = await s.db
    .from('tarefas_dia')
    .update({ status: 'reprovada', motivo_reprovacao: texto, reprovada_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'feita')
    .select('id')
    .maybeSingle()
  if (error) return falha(error)
  if (!data) return { ok: false, erro: 'Só dá para reprovar uma tarefa marcada como feita.' }
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

/** Desfaz a reprovação: volta a contar como feita. */
export async function restaurarTarefa(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { data: t } = await s.db.from('tarefas_dia').select('id, status, feita_em').eq('id', id).maybeSingle()
  if (!t || t.status !== 'reprovada') return { ok: false, erro: 'Esta tarefa não está reprovada.' }
  if (!t.feita_em) return { ok: false, erro: 'Esta tarefa ainda não foi refeita.' }
  const { error } = await s.db
    .from('tarefas_dia')
    .update({ status: 'feita', motivo_reprovacao: null })
    .eq('id', id)
    .eq('status', 'reprovada')
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

export async function decidirExtra(id: string, decisao: 'aprovada' | 'recusada'): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (decisao !== 'aprovada' && decisao !== 'recusada') return { ok: false, erro: 'Decisão inválida.' }
  const { error } = await s.db.from('extras').update({ status: decisao }).eq('id', id)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

export async function marcarAvisosLidos(): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('avisos').update({ lido: true }).eq('empresa_id', s.empresa.id).eq('lido', false)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}
