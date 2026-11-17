import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

/**
 * Sugestões de tarefas: as tarefas recorrentes que o admin (a barbearia de
 * referência) usa hoje, lidas ao vivo. Mentorados atuais e futuros veem sempre
 * a versão mais nova, sem nada para sincronizar.
 */

export type Sugestao = {
  id: string // id do modelo de origem (na empresa do admin)
  grupo: string // função de quem faz na barbearia de referência
  titulo: string
  descricao: string | null
  dias_semana: number[]
  horario_inicio: string | null
  horario_limite: string | null
  tempo_estimado_min: number | null
  continua: boolean
  peso: number
  exige_foto: boolean
  checklist?: string[]
}

export type Sugestoes = { origem: string; empresaId: string; grupos: { nome: string; itens: Sugestao[] }[]; total: number }

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export const mesmoTitulo = (a: string, b: string) => normalizar(a) === normalizar(b)

/** Empresa de referência: a do admin mais antigo. */
async function empresaReferencia(db: ReturnType<typeof createTarefixAdmin>): Promise<{ id: string; nome: string } | null> {
  const { data: admins } = await db.from('admins').select('user_id, criado_em').order('criado_em').limit(1)
  const adminId = admins?.[0]?.user_id
  if (!adminId) return null
  const { data: dono } = await db.from('donos').select('empresa_id').eq('id', adminId).maybeSingle()
  if (!dono) return null
  const { data: emp } = await db.from('empresas').select('id, nome').eq('id', dono.empresa_id).maybeSingle()
  return emp ?? null
}

export async function listarSugestoes(): Promise<Sugestoes | null> {
  const db = createTarefixAdmin()
  const ref = await empresaReferencia(db)
  if (!ref) return null
  const [{ data: modelos }, { data: colabs }, { data: funcoes }] = await Promise.all([
    db
      .from('tarefas_modelo')
      .select('id, colaborador_id, titulo, descricao, dias_semana, horario_inicio, horario_limite, tempo_estimado_min, continua, peso, exige_foto, ordem, checklist')
      .eq('empresa_id', ref.id)
      .eq('ativo', true)
      .order('ordem'),
    db.from('colaboradores').select('id, funcao_id, ativo').eq('empresa_id', ref.id).eq('eh_dono', false), // tarefas pessoais do admin não viram sugestão
    db.from('funcoes').select('id, nome').eq('empresa_id', ref.id),
  ])
  const colab = Object.fromEntries((colabs ?? []).map((c) => [c.id, c]))
  const nomeFuncao = Object.fromEntries((funcoes ?? []).map((f) => [f.id, f.nome as string]))

  const vistos = new Set<string>()
  const porGrupo = new Map<string, Sugestao[]>()
  for (const m of modelos ?? []) {
    const c = colab[m.colaborador_id]
    if (!c || c.ativo === false) continue
    const chave = normalizar(m.titulo)
    if (vistos.has(chave)) continue // a mesma tarefa em vários colaboradores vira uma sugestão só
    vistos.add(chave)
    const grupo = (c.funcao_id && nomeFuncao[c.funcao_id]) || 'Geral'
    const item: Sugestao = {
      id: m.id,
      grupo,
      titulo: m.titulo,
      descricao: m.descricao,
      dias_semana: m.dias_semana,
      horario_inicio: m.horario_inicio,
      horario_limite: m.horario_limite,
      tempo_estimado_min: m.tempo_estimado_min,
      continua: Boolean(m.continua),
      peso: m.peso || 1,
      exige_foto: Boolean(m.exige_foto),
      checklist: m.checklist ?? [],
    }
    porGrupo.set(grupo, [...(porGrupo.get(grupo) ?? []), item])
  }
  // dentro do grupo: as do dia todo primeiro, depois por horário (sem horário no fim)
  const grupos = Array.from(porGrupo.entries())
    .map(([nome, itens]) => ({
      nome,
      itens: itens.sort((a: Sugestao, b: Sugestao) => Number(b.continua) - Number(a.continua) || (a.horario_inicio ?? '99').localeCompare(b.horario_inicio ?? '99')),
    }))
    .sort((a, b) => (a.nome === 'Geral' ? 1 : b.nome === 'Geral' ? -1 : a.nome.localeCompare(b.nome, 'pt-BR')))
  return { origem: ref.nome, empresaId: ref.id, grupos, total: vistos.size }
}

/** Busca os modelos de origem (só da empresa de referência) para copiar. */
export async function modelosParaCopiar(ids: string[]) {
  const db = createTarefixAdmin()
  const ref = await empresaReferencia(db)
  if (!ref || ids.length === 0) return []
  const { data } = await db
    .from('tarefas_modelo')
    .select('id, titulo, descricao, dias_semana, horario_inicio, horario_limite, tempo_estimado_min, continua, peso, exige_foto, checklist')
    .eq('empresa_id', ref.id)
    .eq('ativo', true)
    .in('id', ids.slice(0, 200))
  return data ?? []
}
