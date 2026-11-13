import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { agoraSP, anoMesDe, diaFechado, hojeSP, mesAnterior, minutosParaFechamento, somarDias } from '@/lib/tarefix/datas'
import { gerarELerMes, gerarTarefasDoDia, lerDia, lerMes, placar, ultimoDiaFechado, type Placar } from '@/lib/tarefix/tarefasDia'
import { niveisOrdenados, situacaoBonus, type SituacaoBonus } from '@/lib/tarefix/bonus'
import type { Colaborador, Empresa, TomMensagens } from '@/lib/tarefix/tipos'

// NÃO é 'use server': recebe o colaborador já validado e não pode virar
// uma ação pública (senão qualquer um leria as tarefas de qualquer um).

const BUCKET = 'tarefix-provas'

/* ====================================================================== */
/* Estado da tela Hoje                                                     */
/* ====================================================================== */

export type TarefaTela = {
  id: string
  titulo: string
  descricao: string | null
  exige_foto: boolean
  status: 'pendente' | 'feita' | 'reprovada'
  feita_em: string | null
  motivo_reprovacao: string | null
  foto_url: string | null
  horario_inicio: string | null // 'HH:MM'
  continua: boolean
  peso: number
  autoavaliacao: number | null
  observacao: string | null
  horario_limite: string | null // 'HH:MM'
  tempo_estimado_min: number | null
}

export type ExtraTela = { id: string; descricao: string; status: 'pendente' | 'aprovada' | 'recusada' }

export type EstadoHoje = {
  hoje: string
  fechado: boolean
  minutosParaFechar: number
  folga: boolean
  tarefas: TarefaTela[]
  dia: Placar | null
  mes: Placar | null
  extrasHoje: ExtraTela[]
  extrasAprovadasMes: number
  /* ---- Meu mês, bônus e mensagens ---- */
  anoMes: string
  mesDias: Record<string, number | null> // % de cada dia com tarefas
  folgasMes: string[]
  bonus: SituacaoBonus | null // null = desligado ou escondido do colaborador
  sequencia: number // dias seguidos em 100% antes de hoje
  evolucao: number | null // pontos acima do mês passado (só se > 0)
  tom: TomMensagens
  liberarContinuasMin: number // check das tarefas do dia todo libera X min antes do fechamento
}

export type Ctx = { colaborador: Colaborador; empresa: Empresa }

export async function montarEstado({ colaborador, empresa }: Ctx, gerar: boolean): Promise<EstadoHoje> {
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const anoMes = anoMesDe(hoje)

  // Ao abrir a tela: gera o mês todo até hoje (inclui hoje). Depois de uma ação: só lê.
  const resumoMes = gerar ? await gerarELerMes(colaborador, empresa, anoMes, db) : await lerMes(colaborador.id, anoMes, db, ultimoDiaFechado(empresa.horario_fechamento))
  if (!gerar) await gerarTarefasDoDia(colaborador, empresa, hoje, db)

  const inicioSequencia = somarDias(hoje, -60)
  const [linhas, { data: folgasMes }, { data: extras }, { data: bonusCfg }, { data: recentes }, anterior] = await Promise.all([
    lerDia(colaborador.id, hoje, db),
    db.from('folgas').select('data').eq('colaborador_id', colaborador.id).gte('data', `${anoMes}-01`).lte('data', `${anoMes}-31`),
    db.from('extras').select('id, descricao, status').eq('colaborador_id', colaborador.id).eq('data', hoje).order('criado_em'),
    db.from('bonus_config').select('*').eq('empresa_id', empresa.id).maybeSingle(),
    db.from('tarefas_dia').select('data, status').eq('colaborador_id', colaborador.id).gte('data', inicioSequencia).lt('data', hoje),
    mesPassado(colaborador.id, anoMes, db),
  ])
  const folga = (folgasMes ?? []).some((f) => f.data === hoje)

  // Sequência: dias com tarefas, de ontem para trás, todos 100% (folga/sem tarefa não quebra)
  const porDia: Record<string, { status: string }[]> = {}
  for (const r of recentes ?? []) (porDia[r.data] ??= []).push(r)
  let sequencia = 0
  for (const d of Object.keys(porDia).sort().reverse()) {
    if (porDia[d].every((t) => t.status === 'feita')) sequencia++
    else break
  }

  const niveis = niveisOrdenados(bonusCfg?.niveis)
  const bonusVisivel = Boolean(bonusCfg?.ativo && bonusCfg?.mostrar_para_colaborador && niveis.length)
  const pctMes = resumoMes.placar?.percentual ?? null
  const evolucao = anterior !== null && pctMes !== null && pctMes > anterior ? pctMes - anterior : null

  // Miniaturas das fotos (links temporários do bucket privado)
  const caminhos = linhas.map((t) => t.foto_path).filter((p): p is string => Boolean(p))
  const urls: Record<string, string> = {}
  if (caminhos.length) {
    const { data: assinadas } = await db.storage.from(BUCKET).createSignedUrls(caminhos, 60 * 60)
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
  }

  return {
    hoje,
    fechado: diaFechado(hoje, empresa.horario_fechamento),
    minutosParaFechar: minutosParaFechamento(empresa.horario_fechamento),
    folga,
    tarefas: linhas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      exige_foto: t.exige_foto,
      status: t.status,
      feita_em: t.feita_em,
      motivo_reprovacao: t.motivo_reprovacao,
      foto_url: t.foto_path ? urls[t.foto_path] ?? null : null,
      horario_inicio: t.horario_inicio ? t.horario_inicio.slice(0, 5) : null,
      horario_limite: t.horario_limite ? t.horario_limite.slice(0, 5) : null,
      tempo_estimado_min: t.tempo_estimado_min ?? null,
      continua: t.continua ?? false,
      peso: t.peso ?? 1,
      autoavaliacao: t.autoavaliacao ?? null,
      observacao: t.observacao ?? null,
    })),
    dia: placar(linhas),
    mes: resumoMes.placar,
    extrasHoje: (extras ?? []) as ExtraTela[],
    extrasAprovadasMes: resumoMes.extrasAprovadas,
    anoMes,
    mesDias: Object.fromEntries(Object.entries(resumoMes.porDia).map(([d, p]) => [d, p?.percentual ?? null])),
    folgasMes: (folgasMes ?? []).map((f) => f.data),
    bonus: bonusVisivel ? situacaoBonus(niveis, pctMes) : null,
    sequencia,
    evolucao,
    tom: empresa.tom_mensagens,
    liberarContinuasMin: empresa.liberar_continuas_min ?? 60,
  }
}

/** % final do mês passado: do fechamento, se houver; senão o que estiver registrado. */
async function mesPassado(colaboradorId: string, anoMes: string, db: ReturnType<typeof createTarefixAdmin>): Promise<number | null> {
  const ant = mesAnterior(anoMes)
  const { data: fechado } = await db.from('meses_fechados').select('percentual_final').eq('colaborador_id', colaboradorId).eq('ano_mes', ant).maybeSingle()
  if (fechado) return Math.round(Number(fechado.percentual_final))
  const r = await lerMes(colaboradorId, ant, db)
  return r.placar?.percentual ?? null
}


/* ====================================================================== */
/* Dia anterior (só leitura) — a setinha "‹" da aba Hoje                   */
/* ====================================================================== */

export type DiaPassado = {
  data: string
  folga: boolean
  tarefas: TarefaTela[]
  dia: Placar | null
  extras: ExtraTela[]
}

export const DIAS_PARA_TRAS = 60

/** Monta um dia passado do colaborador (recebe o contexto já validado). */
export async function montarDiaPassado({ colaborador, empresa }: Ctx, data: string): Promise<DiaPassado | null> {
  const hoje = hojeSP()
  const inicio = agoraSP(new Date(colaborador.criado_em)).data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data >= hoje || data < inicio || data < somarDias(hoje, -DIAS_PARA_TRAS)) return null
  const db = createTarefixAdmin()
  await gerarTarefasDoDia(colaborador, empresa, data, db) // dia nunca aberto: gera uma vez (regras de dia fechado)
  const [linhas, { data: folga }, { data: extras }] = await Promise.all([
    lerDia(colaborador.id, data, db),
    db.from('folgas').select('id').eq('colaborador_id', colaborador.id).eq('data', data).maybeSingle(),
    db.from('extras').select('id, descricao, status').eq('colaborador_id', colaborador.id).eq('data', data).order('criado_em'),
  ])
  const caminhos = linhas.map((t) => t.foto_path).filter((p): p is string => Boolean(p))
  const urls: Record<string, string> = {}
  if (caminhos.length) {
    const { data: assinadas } = await db.storage.from(BUCKET).createSignedUrls(caminhos, 60 * 60)
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
  }
  return {
    data,
    folga: Boolean(folga),
    dia: placar(linhas),
    extras: (extras ?? []) as ExtraTela[],
    tarefas: linhas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      exige_foto: t.exige_foto,
      status: t.status,
      feita_em: t.feita_em,
      motivo_reprovacao: t.motivo_reprovacao,
      foto_url: t.foto_path ? urls[t.foto_path] ?? null : null,
      horario_inicio: t.horario_inicio ? t.horario_inicio.slice(0, 5) : null,
      horario_limite: t.horario_limite ? t.horario_limite.slice(0, 5) : null,
      tempo_estimado_min: t.tempo_estimado_min ?? null,
      continua: t.continua ?? false,
      peso: t.peso ?? 1,
      autoavaliacao: t.autoavaliacao ?? null,
      observacao: t.observacao ?? null,
    })),
  }
}
