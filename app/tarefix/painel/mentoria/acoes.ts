'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { donoOuErro, type Resultado } from '@/lib/tarefix/dono'
import { ehAdmin } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import type { Prova, TipoMissao } from '@/lib/tarefix/mentoria'

/** Só o admin mexe na mentoria (tudo pela service role, sempre filtrando pela empresa dele). */
async function admin() {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!(await ehAdmin(s.userId))) return { ok: false as const, erro: 'Só o administrador usa a Mentoria.' }
  return { empresaId: s.empresa.id, db: createTarefixAdmin() }
}

function revalidar() {
  revalidatePath('/tarefix/painel/mentoria', 'layout')
}

const novoToken = () => (randomUUID() + randomUUID()).replace(/-/g, '')
const limparZap = (v: string) => v.replace(/\D/g, '').slice(0, 15) || null

/* ------------------------------- mentorados ------------------------------- */

export async function criarMentorado(d: { nome: string; whatsapp: string }): Promise<{ ok: true; id: string } | { ok: false; erro: string }> {
  const a = await admin()
  if ('ok' in a) return a
  const nome = d.nome.trim().slice(0, 80)
  if (!nome) return { ok: false, erro: 'Diga o nome do mentorado.' }
  const { data, error } = await a.db.from('mentorados').insert({ empresa_id: a.empresaId, nome, whatsapp: limparZap(d.whatsapp) }).select('id').single()
  if (error || !data) return { ok: false, erro: 'Não consegui cadastrar.' }
  revalidar()
  return { ok: true, id: data.id }
}

export async function editarMentorado(id: string, d: { nome: string; whatsapp: string; ativo: boolean }): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const nome = d.nome.trim().slice(0, 80)
  if (!nome) return { ok: false, erro: 'Diga o nome do mentorado.' }
  const { error } = await a.db.from('mentorados').update({ nome, whatsapp: limparZap(d.whatsapp), ativo: d.ativo }).eq('id', id).eq('empresa_id', a.empresaId)
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

export async function novoLinkMentorado(id: string): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  await a.db.from('push_inscricoes').delete().eq('mentorado_id', id) // o aparelho antigo para de receber
  const { error } = await a.db.from('mentorados').update({ token: novoToken() }).eq('id', id).eq('empresa_id', a.empresaId)
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

/* -------------------------------- missões -------------------------------- */

export type DadosMissao = {
  id?: string
  titulo: string
  descricao: string
  tipo: TipoMissao
  data: string // 'AAAA-MM-DD' (tipo data)
  dias_semana: number[] // tipo dias
  dia_prazo: number | null // tipo semanal
  hora: string // 'HH:MM' ou ''
  prova: Prova
  aprovacao: boolean
  mentorados: string[]
  inicio?: string // recorrentes: começa em ('' = já)
  fim?: string // recorrentes: termina em ('' = sem fim)
}

export async function salvarMissao(d: DadosMissao): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const titulo = d.titulo.trim().slice(0, 140)
  if (!titulo) return { ok: false, erro: 'Dê um título para a missão.' }
  if (!['data', 'dias', 'semanal'].includes(d.tipo)) return { ok: false, erro: 'Escolha o tipo de prazo.' }
  if (!['nenhuma', 'foto', 'texto'].includes(d.prova)) return { ok: false, erro: 'Prova inválida.' }
  const dias = Array.from(new Set((d.dias_semana ?? []).filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))).sort()
  if (d.tipo === 'data' && !/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return { ok: false, erro: 'Escolha a data do prazo.' }
  if (d.tipo === 'dias' && dias.length === 0) return { ok: false, erro: 'Escolha pelo menos um dia da semana.' }
  if (d.tipo === 'semanal' && !(Number.isInteger(d.dia_prazo) && d.dia_prazo! >= 0 && d.dia_prazo! <= 6)) return { ok: false, erro: 'Escolha o dia do prazo.' }
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(d.hora) ? d.hora : null
  const dataOk = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const inicio = d.tipo === 'data' ? null : dataOk(d.inicio)
  const fim = d.tipo === 'data' ? null : dataOk(d.fim)
  if (inicio && fim && fim < inicio) return { ok: false, erro: '"Termina em" precisa ser depois de "Começa em".' }

  // só mentorados da própria empresa
  const { data: meus } = await a.db.from('mentorados').select('id').eq('empresa_id', a.empresaId).in('id', (d.mentorados ?? []).slice(0, 200))
  const para = (meus ?? []).map((m) => m.id)
  if (para.length === 0) return { ok: false, erro: 'Escolha para quem é a missão.' }

  const linha = {
    titulo,
    descricao: d.descricao.trim().slice(0, 2000) || null,
    tipo: d.tipo,
    data: d.tipo === 'data' ? d.data : null,
    dias_semana: d.tipo === 'dias' ? dias : [],
    dia_prazo: d.tipo === 'semanal' ? d.dia_prazo : null,
    hora,
    prova: d.prova,
    aprovacao: Boolean(d.aprovacao),
    inicio,
    fim,
  }
  let id = d.id
  if (id) {
    const { error } = await a.db.from('missoes').update(linha).eq('id', id).eq('empresa_id', a.empresaId)
    if (error) return { ok: false, erro: error.message }
    // atribuições: tira quem saiu (e as pendentes dele somem na próxima geração), põe quem entrou
    const { data: atuais } = await a.db.from('missoes_mentorados').select('mentorado_id').eq('missao_id', id)
    const sair = (atuais ?? []).map((x) => x.mentorado_id).filter((m) => !para.includes(m))
    if (sair.length) await a.db.from('missoes_mentorados').delete().eq('missao_id', id).in('mentorado_id', sair)
  } else {
    const { data, error } = await a.db.from('missoes').insert({ ...linha, empresa_id: a.empresaId }).select('id').single()
    if (error || !data) return { ok: false, erro: 'Não consegui salvar a missão.' }
    id = data.id
  }
  await a.db.from('missoes_mentorados').upsert(para.map((m) => ({ missao_id: id, mentorado_id: m })), { onConflict: 'missao_id,mentorado_id', ignoreDuplicates: true })
  revalidar()
  return { ok: true }
}

export async function pausarMissao(id: string, ativo: boolean): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const { error } = await a.db.from('missoes').update({ ativo }).eq('id', id).eq('empresa_id', a.empresaId)
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

export async function excluirMissao(id: string): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const { error } = await a.db.from('missoes').delete().eq('id', id).eq('empresa_id', a.empresaId)
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

/* ------------------------------- entregas ------------------------------- */

export async function decidirEntrega(id: string, decisao: 'aprovar' | 'devolver', motivo: string): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const { data: e } = await a.db.from('entregas').select('id, mentorado_id, status').eq('id', id).maybeSingle()
  if (!e) return { ok: false, erro: 'Entrega não encontrada.' }
  const { data: m } = await a.db.from('mentorados').select('id').eq('id', e.mentorado_id).eq('empresa_id', a.empresaId).maybeSingle()
  if (!m) return { ok: false, erro: 'Entrega não encontrada.' }
  const texto = motivo.trim().slice(0, 300)
  if (decisao === 'devolver' && !texto) return { ok: false, erro: 'Diga o que precisa ajustar.' }
  const { error } = await a.db
    .from('entregas')
    .update(decisao === 'aprovar' ? { status: 'aprovada', decidida_em: new Date().toISOString(), motivo: null } : { status: 'devolvida', decidida_em: new Date().toISOString(), motivo: texto })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

/* -------------------------------- reunião -------------------------------- */

/** Marca (ou remarca) a próxima reunião: substitui as futuras por esta. */
export async function salvarReuniao(mentoradoId: string, d: { data: string; hora: string; link: string }): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.hora)) return { ok: false, erro: 'Escolha a data e a hora.' }
  const link = d.link.trim().slice(0, 500)
  if (link && !/^https?:\/\/\S+$/i.test(link)) return { ok: false, erro: 'O link precisa começar com https://' }
  const { data: m } = await a.db.from('mentorados').select('id').eq('id', mentoradoId).eq('empresa_id', a.empresaId).maybeSingle()
  if (!m) return { ok: false, erro: 'Mentorado não encontrado.' }
  const quando = new Date(`${d.data}T${d.hora}:00-03:00`) // horário de Brasília
  if (quando.getTime() < Date.now() - 60 * 60 * 1000) return { ok: false, erro: 'Essa data já passou.' }
  await a.db.from('reunioes').delete().eq('mentorado_id', mentoradoId).gte('quando', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
  const { error } = await a.db.from('reunioes').insert({ mentorado_id: mentoradoId, quando: quando.toISOString(), link: link || null })
  if (error) return { ok: false, erro: error.message }
  revalidar()
  return { ok: true }
}

export async function removerReuniao(id: string): Promise<Resultado> {
  const a = await admin()
  if ('ok' in a) return a
  const { data: r } = await a.db.from('reunioes').select('mentorado_id').eq('id', id).maybeSingle()
  if (!r) return { ok: true }
  const { data: m } = await a.db.from('mentorados').select('id').eq('id', r.mentorado_id).eq('empresa_id', a.empresaId).maybeSingle()
  if (!m) return { ok: false, erro: 'Reunião não encontrada.' }
  await a.db.from('reunioes').delete().eq('id', id)
  revalidar()
  return { ok: true }
}
