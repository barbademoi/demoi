import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { agoraSP, anoMesDe, datasDoMes, diaDaSemana, diaFechado, hojeSP, somarDias } from '@/lib/tarefix/datas'
import type { Colaborador, Empresa, TarefaAvulsa, TarefaDia, TarefaModelo } from '@/lib/tarefix/tipos'
import { ordenarPorPrazo } from '@/lib/tarefix/prazo'

/**
 * Geração das tarefas do dia — SEM cron.
 *
 * gerarTarefasDoDia / gerarTarefasPeriodo criam em tarefas_dia (upsert pela
 * UNIQUE colaborador+data+origem+origem_id, sem sobrescrever o que já existe)
 * as tarefas dos modelos ativos daquele dia da semana + as avulsas da data.
 * Título/descrição/exige_foto são copiados: editar o modelo depois não muda
 * dias passados.
 *
 * Não gera nada: em folga, antes do cadastro do colaborador, depois de hoje,
 * nem em mês já fechado.
 *
 * Em dia ainda ABERTO (hoje antes do fechamento), também sincroniza as
 * pendentes com os modelos atuais: some a tarefa pausada/excluída/sem aquele
 * dia, e título/ordem acompanham a edição.
 *
 * Usa service role: quem chama já validou o acesso (dono ou colaborador).
 */

type Db = ReturnType<typeof createTarefixAdmin>
type ColabMin = Pick<Colaborador, 'id' | 'empresa_id' | 'criado_em'>
type EmpresaMin = Pick<Empresa, 'id' | 'horario_fechamento'>

const ORDEM_AVULSAS = 1000

export async function gerarTarefasPeriodo(colab: ColabMin, empresa: EmpresaMin, datas: string[], db: Db = createTarefixAdmin()) {
  const hoje = hojeSP()
  const inicio = agoraSP(new Date(colab.criado_em)).data
  const alvo = datas.filter((d) => d <= hoje && d >= inicio)
  if (alvo.length === 0) return

  const min = alvo[0]
  const max = alvo[alvo.length - 1]
  const meses = Array.from(new Set(alvo.map(anoMesDe)))

  const [{ data: modelos }, { data: avulsas }, { data: folgas }, { data: fechados }, { data: existentes }] = await Promise.all([
    db.from('tarefas_modelo').select('*').eq('colaborador_id', colab.id).eq('ativo', true),
    db.from('tarefas_avulsas').select('*').eq('colaborador_id', colab.id).gte('data', min).lte('data', max),
    db.from('folgas').select('data').eq('colaborador_id', colab.id).gte('data', min).lte('data', max),
    db.from('meses_fechados').select('ano_mes').eq('empresa_id', colab.empresa_id).in('ano_mes', meses),
    db.from('tarefas_dia').select('data').eq('colaborador_id', colab.id).gte('data', min).lte('data', max),
  ])

  const diasFolga = new Set((folgas ?? []).map((f) => f.data))
  const mesesFechados = new Set((fechados ?? []).map((f) => f.ano_mes))
  const diasComTarefas = new Set((existentes ?? []).map((t) => t.data))
  // Dia FECHADO que já tem tarefas não muda mais (senão uma tarefa criada hoje
  // entraria nos dias passados e derrubaria o % de quem já fechou o dia).
  // Dia fechado ainda sem nenhuma linha (ninguém abriu) é gerado uma vez.
  const datasValidas = alvo.filter(
    (d) =>
      !diasFolga.has(d) &&
      !mesesFechados.has(anoMesDe(d)) &&
      !(diasComTarefas.has(d) && diaFechado(d, empresa.horario_fechamento))
  )
  if (datasValidas.length === 0) return

  const linhas: Omit<TarefaDia, 'id' | 'status' | 'feita_em' | 'foto_path' | 'motivo_reprovacao' | 'reprovada_em' | 'autoavaliacao' | 'observacao' | 'observacao_em'>[] = []
  for (const data of datasValidas) {
    const dow = diaDaSemana(data)
    const aberto = !diaFechado(data, empresa.horario_fechamento)
    for (const m of (modelos ?? []) as TarefaModelo[]) {
      if (!m.dias_semana.includes(dow)) continue
      // gerando um dia passado tardiamente: só vale modelo que já existia naquele dia
      if (!aberto && agoraSP(new Date(m.criado_em)).data > data) continue
      linhas.push({
        empresa_id: colab.empresa_id, colaborador_id: colab.id, data, origem: 'modelo', origem_id: m.id,
        titulo: m.titulo, descricao: m.descricao, exige_foto: m.exige_foto, ordem: m.ordem,
        horario_inicio: m.horario_inicio ?? null, horario_limite: m.horario_limite ?? null, tempo_estimado_min: m.tempo_estimado_min ?? null,
        continua: m.continua ?? false, peso: m.peso ?? 1,
      })
    }
    ;((avulsas ?? []) as TarefaAvulsa[])
      .filter((a) => a.data === data)
      .forEach((a, i) => {
        linhas.push({
          empresa_id: colab.empresa_id, colaborador_id: colab.id, data, origem: 'avulsa', origem_id: a.id,
          titulo: a.titulo, descricao: a.descricao, exige_foto: a.exige_foto, ordem: ORDEM_AVULSAS + i,
          horario_inicio: a.horario_inicio ?? null, horario_limite: a.horario_limite ?? null, tempo_estimado_min: a.tempo_estimado_min ?? null,
          continua: a.continua ?? false, peso: a.peso ?? 1,
        })
      })
  }

  if (linhas.length > 0) {
    const { error } = await db
      .from('tarefas_dia')
      .upsert(linhas, { onConflict: 'colaborador_id,data,origem,origem_id', ignoreDuplicates: true })
    if (error) throw new Error(`Falha ao gerar tarefas: ${error.message}`)
  }

  // Dia de hoje ainda aberto: alinhar as PENDENTES com os modelos/avulsas atuais.
  if (datasValidas.includes(hoje) && !diaFechado(hoje, empresa.horario_fechamento)) {
    const esperadas = new Map(linhas.filter((l) => l.data === hoje).map((l) => [`${l.origem}:${l.origem_id}`, l]))
    const { data: pendentes } = await db
      .from('tarefas_dia')
      .select('id, origem, origem_id, titulo, descricao, exige_foto, ordem, horario_inicio, horario_limite, tempo_estimado_min, continua, peso')
      .eq('colaborador_id', colab.id)
      .eq('data', hoje)
      .eq('status', 'pendente')
    const remover: string[] = []
    for (const p of pendentes ?? []) {
      const e = esperadas.get(`${p.origem}:${p.origem_id}`)
      if (!e) {
        remover.push(p.id)
      } else if (
        e.titulo !== p.titulo || e.descricao !== p.descricao || e.exige_foto !== p.exige_foto || e.ordem !== p.ordem ||
        mesmoHorario(e.horario_limite) !== mesmoHorario(p.horario_limite) || mesmoHorario(e.horario_inicio) !== mesmoHorario(p.horario_inicio) ||
        (e.tempo_estimado_min ?? null) !== (p.tempo_estimado_min ?? null) || e.continua !== (p.continua ?? false) || e.peso !== (p.peso ?? 1)
      ) {
        await db
          .from('tarefas_dia')
          .update({ titulo: e.titulo, descricao: e.descricao, exige_foto: e.exige_foto, ordem: e.ordem, horario_inicio: e.horario_inicio, horario_limite: e.horario_limite, tempo_estimado_min: e.tempo_estimado_min, continua: e.continua, peso: e.peso })
          .eq('id', p.id)
      }
    }
    if (remover.length) await db.from('tarefas_dia').delete().in('id', remover)
  }
}

/** '09:00' e '09:00:00' são o mesmo horário. */
function mesmoHorario(h: string | null | undefined) {
  return h ? h.slice(0, 5) : null
}

export function gerarTarefasDoDia(colab: ColabMin, empresa: EmpresaMin, data: string, db?: Db) {
  return gerarTarefasPeriodo(colab, empresa, [data], db)
}

/* ---------------------------------------------------------------------- */
/* Leitura e cálculo                                                       */
/* ---------------------------------------------------------------------- */

export type Placar = { feitas: number; total: number; percentual: number; pontos: number; pontosTotal: number }

/**
 * Percentual = soma dos pesos das feitas ÷ soma de todos os pesos (reprovadas
 * e pendentes contam como não feitas; tarefa sem peso vale 1).
 * feitas/total continuam sendo a CONTAGEM de tarefas, para os textos "3 de 5".
 * Sem tarefas → null.
 */
export function placar(tarefas: { status: TarefaDia['status']; peso?: number | null }[]): Placar | null {
  const total = tarefas.length
  if (total === 0) return null
  const feitas = tarefas.filter((t) => t.status === 'feita').length
  const p = (t: { peso?: number | null }) => (t.peso && t.peso > 0 ? t.peso : 1)
  const pesoTotal = tarefas.reduce((n, t) => n + p(t), 0)
  const pesoFeito = tarefas.filter((t) => t.status === 'feita').reduce((n, t) => n + p(t), 0)
  return { feitas, total, percentual: Math.round((pesoFeito / pesoTotal) * 100), pontos: pesoFeito, pontosTotal: pesoTotal }
}

/** Último dia que já fechou (hoje depois do horário; senão ontem). O mês conta só até ele. */
export function ultimoDiaFechado(horarioFechamento: string, ref: Date = new Date()): string {
  const hoje = hojeSP(ref)
  return diaFechado(hoje, horarioFechamento, ref) ? hoje : somarDias(hoje, -1)
}

export async function lerDia(colaboradorId: string, data: string, db: Db = createTarefixAdmin()): Promise<TarefaDia[]> {
  const { data: linhas } = await db
    .from('tarefas_dia')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .eq('data', data)
  return ordenarPorPrazo((linhas ?? []) as TarefaDia[])
}

export type ResumoMes = {
  anoMes: string
  placar: Placar | null
  porDia: Record<string, Placar | null> // só datas com tarefas
  extrasAprovadas: number
}

/**
 * Lê o mês. porDia traz todos os dias até hoje (o calendário mostra o dia em
 * andamento); o placar do mês conta só até `ateDia` (os dias já FECHADOS),
 * para o percentual não "despencar" toda manhã com as tarefas que ainda
 * estão por fazer. Chame gerarTarefasPeriodo antes se precisar garantir os dias.
 */
export async function lerMes(colaboradorId: string, anoMes: string, db: Db = createTarefixAdmin(), ateDia?: string): Promise<ResumoMes> {
  const hoje = hojeSP()
  const datas = datasDoMes(anoMes, hoje)
  if (datas.length === 0) return { anoMes, placar: null, porDia: {}, extrasAprovadas: 0 }
  const ini = datas[0]
  const fim = datas[datas.length - 1]
  const [{ data: linhas }, { count: extras }] = await Promise.all([
    db.from('tarefas_dia').select('data, status, peso').eq('colaborador_id', colaboradorId).gte('data', ini).lte('data', fim),
    db.from('extras').select('*', { count: 'exact', head: true }).eq('colaborador_id', colaboradorId).eq('status', 'aprovada').gte('data', `${anoMes}-01`).lte('data', `${anoMes}-31`),
  ])
  const porData: Record<string, { status: TarefaDia['status']; peso?: number | null }[]> = {}
  for (const l of linhas ?? []) (porData[l.data] ??= []).push(l)
  const porDia: Record<string, Placar | null> = {}
  for (const [d, ts] of Object.entries(porData)) porDia[d] = placar(ts)
  const doPlacar = ateDia ? (linhas ?? []).filter((l) => l.data <= ateDia) : linhas ?? []
  return { anoMes, placar: placar(doPlacar), porDia, extrasAprovadas: extras ?? 0 }
}

/** Gera todos os dias do mês até hoje e devolve o resumo. */
export async function gerarELerMes(colab: ColabMin, empresa: EmpresaMin, anoMes: string, db: Db = createTarefixAdmin()) {
  await gerarTarefasPeriodo(colab, empresa, datasDoMes(anoMes, hojeSP()), db)
  return lerMes(colab.id, anoMes, db, ultimoDiaFechado(empresa.horario_fechamento))
}
