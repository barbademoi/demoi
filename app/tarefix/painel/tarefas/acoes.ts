'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado, type SessaoDono } from '@/lib/tarefix/dono'
import { ROTINA_DONO } from '@/lib/tarefix/rotinaDono'

type SessaoDonoDb = SessaoDono['db']
import { lerHorario, lerMinutos } from '@/lib/tarefix/prazo'
import { mesmoTitulo, modelosParaCopiar } from '@/lib/tarefix/sugestoes'

/** Lê "fazer até" e "tempo estimado" do formulário (ou devolve a mensagem de erro). */
function lerPrazo(d: { horario_inicio: string; horario_limite: string; tempo_estimado_min: string; continua: boolean; peso: number }) {
  const peso = Math.round(Number(d.peso))
  if (![1, 2, 3].includes(peso)) return 'Peso precisa ser 1, 2 ou 3.'
  // Do dia todo: não tem horário nem tempo (vale o dia inteiro).
  if (d.continua) return { continua: true, peso, horario_inicio: null, horario_limite: null, tempo_estimado_min: null }
  const horario_inicio = lerHorario(d.horario_inicio)
  if (horario_inicio === undefined) return 'Hora de começar inválida. Use HH:MM.'
  const horario_limite = lerHorario(d.horario_limite)
  if (horario_limite === undefined) return 'Horário "fazer até" inválido. Use HH:MM.'
  const tempo_estimado_min = lerMinutos(d.tempo_estimado_min)
  if (tempo_estimado_min === undefined) return 'Tempo estimado: de 1 a 600 minutos.'
  if (horario_inicio && horario_limite && horario_limite <= horario_inicio) return '"Fazer até" precisa ser depois da hora de começar.'
  return { continua: false, peso, horario_inicio, horario_limite, tempo_estimado_min }
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
  continua: boolean // vale o dia todo
  peso: number // 1..3
  horario_inicio: string // 'HH:MM' ou ''
  horario_limite: string // 'HH:MM' ou ''
  tempo_estimado_min: string // minutos ou ''
  checklist?: string[]
  categoria_id?: string | null
  inicio?: string // 'AAAA-MM-DD' ou '' (começa em)
  fim?: string // 'AAAA-MM-DD' ou '' (termina em)
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
  const periodo = lerPeriodo(d.inicio, d.fim)
  if (typeof periodo === 'string') return { ok: false, erro: periodo }
  const linha = {
    titulo, descricao: d.descricao.trim() || null, dias_semana: dias, exige_foto: d.exige_foto, ativo: d.ativo, ...prazo, ...periodo,
    checklist: lerChecklist(d.checklist), categoria_id: await lerCategoria(s.db, d.categoria_id),
  }

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
  continua: boolean
  peso: number
  horario_inicio: string
  horario_limite: string
  tempo_estimado_min: string
  checklist?: string[]
  categoria_id?: string | null
}

/** "Começa em" / "Termina em" (opcionais). */
function lerPeriodo(inicio?: string, fim?: string): { inicio: string | null; fim: string | null } | string {
  const data = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const i = data(inicio)
  const f = data(fim)
  if (i && f && f < i) return '"Termina em" precisa ser depois de "Começa em".'
  return { inicio: i, fim: f }
}

/** Checklist limpo: até 20 itens de até 80 caracteres, sem vazios. */
function lerChecklist(v: unknown): string[] {
  return (Array.isArray(v) ? v : [])
    .map((x) => String(x ?? '').trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 20)
}

/** Categoria só se for da própria empresa (RLS confere). */
async function lerCategoria(db: SessaoDonoDb, id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  const { data } = await db.from('categorias').select('id').eq('id', id).maybeSingle()
  return data?.id ?? null
}

export async function salvarAvulsa(d: DadosAvulsa): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const titulo = d.titulo.trim()
  if (!titulo) return { ok: false, erro: 'Dê um título para a tarefa.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return { ok: false, erro: 'Escolha a data.' }
  const prazo = lerPrazo(d)
  if (typeof prazo === 'string') return { ok: false, erro: prazo }
  const linha = {
    titulo, descricao: d.descricao.trim() || null, data: d.data, exige_foto: d.exige_foto, ...prazo,
    checklist: lerChecklist(d.checklist), categoria_id: await lerCategoria(s.db, d.categoria_id),
  }
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

/**
 * Copia sugestões (tarefas da barbearia de referência) para um colaborador.
 * Pula as que ele já tem com o mesmo título. Depois, cada uma é editável normalmente.
 */
export async function adicionarSugestoes(colaboradorId: string, ids: string[]): Promise<{ ok: true; adicionadas: number } | { ok: false; erro: string }> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  // RLS: só encontra colaborador da própria empresa
  const { data: colab } = await s.db.from('colaboradores').select('id, eh_dono').eq('id', colaboradorId).maybeSingle()
  if (!colab) return { ok: false, erro: 'Colaborador não encontrado.' }
  // Meu dia: a sugestão de rotina entra na categoria com o mesmo nome do grupo
  const { data: cats } = colab.eh_dono ? await s.db.from('categorias').select('id, nome') : { data: [] as { id: string; nome: string }[] }
  const categoriaDo = (grupo?: string) => (cats ?? []).find((c) => c.nome === grupo)?.id ?? null
  const fixas = ROTINA_DONO.grupos.flatMap((g) => g.itens).filter((x) => ids.includes(x.id))
  const origem = [...fixas, ...(await modelosParaCopiar(ids.filter((id) => !id.startsWith('rotina-'))))]
  if (origem.length === 0) return { ok: false, erro: 'Escolha pelo menos uma sugestão.' }

  const { data: atuais } = await s.db.from('tarefas_modelo').select('titulo, ordem').eq('colaborador_id', colaboradorId)
  let ordem = Math.max(-1, ...(atuais ?? []).map((t) => t.ordem ?? 0))
  const ordemPedida = new Map(ids.map((id, i) => [id, i]))
  const novas = origem
    .filter((m) => !(atuais ?? []).some((t) => mesmoTitulo(t.titulo, m.titulo)))
    .sort((a, b) => (ordemPedida.get(a.id) ?? 0) - (ordemPedida.get(b.id) ?? 0))
    .map((m) => ({
      empresa_id: s.empresa.id,
      colaborador_id: colaboradorId,
      titulo: m.titulo,
      descricao: m.descricao,
      dias_semana: m.dias_semana,
      horario_inicio: m.continua ? null : m.horario_inicio,
      horario_limite: m.continua ? null : m.horario_limite,
      tempo_estimado_min: m.continua ? null : m.tempo_estimado_min,
      continua: Boolean(m.continua),
      peso: m.peso || 1,
      exige_foto: Boolean(m.exige_foto),
      checklist: m.checklist ?? [],
      categoria_id: 'grupo' in m ? categoriaDo((m as { grupo?: string }).grupo) : null,
      ativo: true,
      ordem: ++ordem,
    }))
  if (novas.length === 0) return { ok: true, adicionadas: 0 }
  const { error } = await s.db.from('tarefas_modelo').insert(novas)
  if (error) return { ok: false, erro: (falha(error) as { erro: string }).erro }
  revalidar()
  return { ok: true, adicionadas: novas.length }
}
