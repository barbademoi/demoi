'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'
import { lerHorario, lerMinutos } from '@/lib/tarefix/prazo'

/** Lê "fazer até" e "tempo estimado" do formulário (ou devolve a mensagem de erro). */
function lerPrazo(d: { horario_inicio: string; horario_limite: string; tempo_estimado_min: string }) {
  const horario_inicio = lerHorario(d.horario_inicio)
  if (horario_inicio === undefined) return 'Hora de começar inválida. Use HH:MM.'
  const horario_limite = lerHorario(d.horario_limite)
  if (horario_limite === undefined) return 'Horário "fazer até" inválido. Use HH:MM.'
  const tempo_estimado_min = lerMinutos(d.tempo_estimado_min)
  if (tempo_estimado_min === undefined) return 'Tempo estimado: de 1 a 600 minutos.'
  if (horario_inicio && horario_limite && horario_limite <= horario_inicio) return '"Fazer até" precisa ser depois da hora de começar.'
  return { horario_inicio, horario_limite, tempo_estimado_min }
}

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
  horario_inicio: string // 'HH:MM' ou ''
  horario_limite: string // 'HH:MM' ou ''
  tempo_estimado_min: string // minutos ou ''
}

export async function salvarModelo(d: DadosModelo): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const titulo = d.titulo.trim()
  if (!titulo) return { ok: false, erro: 'Dê um título para a tarefa.' }
  const dias = Array.from(new Set(d.dias_semana.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))).sort()
  if (dias.length === 0) return { ok: false, erro: 'Escolha pelo menos um dia da semana.' }
  const prazo = lerPrazo(d)
  if (typeof prazo === 'string') return { ok: false, erro: prazo }
  const linha = { titulo, descricao: d.descricao.trim() || null, dias_semana: dias, exige_foto: d.exige_foto, ativo: d.ativo, ...prazo }

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
  horario_inicio: string
  horario_limite: string
  tempo_estimado_min: string
}

export async function salvarAvulsa(d: DadosAvulsa): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const titulo = d.titulo.trim()
  if (!titulo) return { ok: false, erro: 'Dê um título para a tarefa.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return { ok: false, erro: 'Escolha a data.' }
  const prazo = lerPrazo(d)
  if (typeof prazo === 'string') return { ok: false, erro: prazo }
  const linha = { titulo, descricao: d.descricao.trim() || null, data: d.data, exige_foto: d.exige_foto, ...prazo }
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
