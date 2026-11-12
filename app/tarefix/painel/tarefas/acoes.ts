'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'

function revalidar() {
  revalidatePath('/tarefix/painel', 'layout')
}

export type DadosModelo = {
  id?: string
  colaborador_id: string
  titulo: string
  descricao: string
  dias_semana: number[]
  exige_foto: boolean
  ativo: boolean
}

export async function salvarModelo(d: DadosModelo): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const titulo = d.titulo.trim()
  if (!titulo) return { ok: false, erro: 'Dê um título para a tarefa.' }
  const dias = Array.from(new Set(d.dias_semana.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))).sort()
  if (dias.length === 0) return { ok: false, erro: 'Escolha pelo menos um dia da semana.' }
  const linha = { titulo, descricao: d.descricao.trim() || null, dias_semana: dias, exige_foto: d.exige_foto, ativo: d.ativo }

  if (d.id) {
    const { error } = await s.db.from('tarefas_modelo').update(linha).eq('id', d.id)
    if (error) return falha(error)
  } else {
    // nova tarefa vai para o fim da lista
    const { data: ultima } = await s.db
      .from('tarefas_modelo')
      .select('ordem')
      .eq('colaborador_id', d.colaborador_id)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { error } = await s.db.from('tarefas_modelo').insert({
      ...linha,
      empresa_id: s.empresa.id,
      colaborador_id: d.colaborador_id,
      ordem: (ultima?.ordem ?? -1) + 1,
    })
    if (error) return falha(error)
  }
  revalidar()
  return { ok: true }
}

export async function excluirModelo(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  // Dias que já aconteceram guardaram uma cópia em tarefas_dia: o histórico não muda.
  const { error } = await s.db.from('tarefas_modelo').delete().eq('id', id)
  if (error) return falha(error)
  revalidar()
  return { ok: true }
}

export async function reordenarModelos(colaboradorId: string, ids: string[]): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const resultados = await Promise.all(
    ids.map((id, ordem) => s.db.from('tarefas_modelo').update({ ordem }).eq('id', id).eq('colaborador_id', colaboradorId))
  )
  const erro = resultados.find((r) => r.error)?.error
  if (erro) return falha(erro)
  revalidar()
  return { ok: true }
}

export type DadosAvulsa = {
  id?: string
  colaborador_id: string
  titulo: string
  descricao: string
  data: string
  exige_foto: boolean
}

export async function salvarAvulsa(d: DadosAvulsa): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const titulo = d.titulo.trim()
  if (!titulo) return { ok: false, erro: 'Dê um título para a tarefa.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return { ok: false, erro: 'Escolha a data.' }
  const linha = { titulo, descricao: d.descricao.trim() || null, data: d.data, exige_foto: d.exige_foto }
  const { error } = d.id
    ? await s.db.from('tarefas_avulsas').update(linha).eq('id', d.id)
    : await s.db.from('tarefas_avulsas').insert({ ...linha, empresa_id: s.empresa.id, colaborador_id: d.colaborador_id })
  if (error) return falha(error)
  revalidar()
  return { ok: true }
}

export async function excluirAvulsa(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('tarefas_avulsas').delete().eq('id', id)
  if (error) return falha(error)
  revalidar()
  return { ok: true }
}
