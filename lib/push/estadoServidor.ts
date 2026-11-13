/**
 * A FOTOGRAFIA DO ESTADO que as regras de notificação precisam.
 *
 * Lê o banco e devolve, por barbearia, o que o dono e cada barbeiro já
 * fizeram hoje. Quem decide o que mandar é `lib/push/regras` — que é pura e
 * não sabe o que é uma tabela. Aqui só se lê.
 *
 * ── UMA CONSULTA POR TABELA, NÃO UMA POR BARBEARIA ──────────────────────────
 * O cron roda pra todas as barbearias inscritas de uma vez. Perguntar "este
 * dono lançou hoje?" barbearia por barbearia seria uma consulta por conta, de
 * hora em hora — a conta que derruba o banco quando a base cresce. Então cada
 * tabela é lida UMA vez, para todas, e o agrupamento acontece em memória.
 */

import { cicloAtual, hojeBrasil, type Ciclo } from '@/lib/ciclo'
import { calendarioDoPeriodo } from '@/lib/operacao/calendario'
import { lerExcecoesCalendario } from '@/lib/operacao/excecoes'
import type { Agora, EstadoDono, EstadoBarbeiro } from './regras'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** O "agora" em São Paulo, no formato que as regras esperam. */
export function agoraSaoPaulo(base: Date = new Date()): Agora {
  const sp = new Date(base.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const ultimoDia = new Date(sp.getFullYear(), sp.getMonth() + 1, 0).getDate()
  const proximo = sp.getMonth() === 11 ? 0 : sp.getMonth() + 1
  return {
    dia: iso(sp),
    hora: sp.getHours(),
    diaDaSemana: sp.getDay(),
    diaDoMes: sp.getDate(),
    diasAteFimDoMes: ultimoDia - sp.getDate() + 1,
    nomeProximoMes: MESES[proximo],
  }
}

export interface BarbeariaParaAvisar {
  id: string
  dono: EstadoDono | null
  barbeiros: EstadoBarbeiro[]
  ciclo: Ciclo
}

/**
 * Monta o estado de todas as barbearias que têm alguém inscrito.
 *
 * Só elas: avaliar barbearia sem nenhum aparelho inscrito seria trabalho pra
 * jogar fora de hora em hora.
 */
export async function carregarEstado(
  admin: Admin,
  destinos: string[],
  agora: Agora,
): Promise<BarbeariaParaAvisar[]> {
  if (destinos.length === 0) return []

  const donosInscritos = new Set(
    destinos.filter((d) => d.startsWith('dono:')).map((d) => d.slice(5)))
  const barbeirosInscritos = new Set(
    destinos.filter((d) => d.startsWith('barbeiro:')).map((d) => d.slice(9)))

  // ── Quem é de qual barbearia ──
  const { data: usuariosRaw } = await admin
    .from('usuarios').select('id, barbearia_id')
    .in('id', Array.from(donosInscritos))
  const { data: barbeirosRaw } = await admin
    .from('barbeiros')
    .select('id, barbearia_id, link_codigo, ativo, tipo')
    .in('id', Array.from(barbeirosInscritos))

  type U = { id: string; barbearia_id: string }
  type B = { id: string; barbearia_id: string; link_codigo: string; ativo: boolean; tipo: string }
  const usuarios = (usuariosRaw ?? []) as U[]
  const barbeiros = ((barbeirosRaw ?? []) as B[]).filter((b) => b.ativo)

  const ids = Array.from(new Set([
    ...usuarios.map((u) => u.barbearia_id),
    ...barbeiros.map((b) => b.barbearia_id),
  ]))
  if (ids.length === 0) return []

  // ── Configuração de cada barbearia ──
  const { data: barbeariasRaw } = await admin
    .from('barbearias')
    .select('id, dia_fechamento, dias_trabalhados')
    .in('id', ids)
  type Barbearia = { id: string; dia_fechamento: number | null; dias_trabalhados: unknown }
  const barbeariasPorId = new Map<string, Barbearia>(
    ((barbeariasRaw ?? []) as Barbearia[]).map((b) => [b.id, b]))

  const hoje = hojeBrasil()

  // ── O dono lançou hoje? `lancamentos_diarios` é a foto do dia ──
  const { data: fotosRaw } = await admin
    .from('lancamentos_diarios')
    .select('barbearia_id, barbeiro_id, data, valor')
    .in('barbearia_id', ids)
    .eq('data', agora.dia)
  type Foto = { barbearia_id: string; barbeiro_id: string; valor: number | null }
  const lancouHojePorBarbearia = new Set(
    ((fotosRaw ?? []) as Foto[]).filter((f) => Number(f.valor) > 0).map((f) => f.barbearia_id))

  // ── Campanha do ciclo, por barbearia ──
  const ciclosPorBarbearia = new Map<string, Ciclo>()
  for (const id of ids) {
    const dia = barbeariasPorId.get(id)?.dia_fechamento ?? 1
    ciclosPorBarbearia.set(id, cicloAtual(dia, hoje))
  }

  const { data: campanhasRaw } = await admin
    .from('campanha')
    .select('id, barbearia_id, mes, ano, ativo, quem_lanca')
    .in('barbearia_id', ids)
  type Camp = {
    id: string; barbearia_id: string; mes: number; ano: number
    ativo: boolean | null; quem_lanca: string | null
  }
  const campanhaPorBarbearia = new Map<string, Camp>()
  for (const c of (campanhasRaw ?? []) as Camp[]) {
    const ciclo = ciclosPorBarbearia.get(c.barbearia_id)
    if (!ciclo || c.mes !== ciclo.mesRef || c.ano !== ciclo.anoRef) continue
    if (c.ativo === false) continue
    campanhaPorBarbearia.set(c.barbearia_id, c)
  }

  // ── O barbeiro lançou os pontos de hoje? ──
  // Duas formas de "resolveu o dia": lançou pontos, ou marcou que não pontuou.
  const idsBarbeiros = barbeiros.map((b) => b.id)
  const { data: controleRaw } = idsBarbeiros.length
    ? await admin.from('controle_diario')
      .select('barbeiro_id').in('barbeiro_id', idsBarbeiros).eq('data', agora.dia)
    : { data: [] }
  const { data: semPontoRaw } = idsBarbeiros.length
    ? await admin.from('dias_sem_pontuacao')
      .select('barbeiro_id').in('barbeiro_id', idsBarbeiros).eq('data', agora.dia)
    : { data: [] }
  const resolveuHoje = new Set<string>([
    ...((controleRaw ?? []) as { barbeiro_id: string }[]).map((r) => r.barbeiro_id),
    ...((semPontoRaw ?? []) as { barbeiro_id: string }[]).map((r) => r.barbeiro_id),
  ])

  // ── Comissão do ciclo, por barbeiro ──
  const { data: lancRaw } = idsBarbeiros.length
    ? await admin.from('lancamentos')
      .select('barbeiro_id, mes, ano, comissao_acumulada').in('barbeiro_id', idsBarbeiros)
    : { data: [] }
  type Lanc = { barbeiro_id: string; mes: number; ano: number; comissao_acumulada: number }
  const comissaoPor = new Map<string, number>()
  for (const l of (lancRaw ?? []) as Lanc[]) {
    comissaoPor.set(`${l.barbeiro_id}|${l.mes}-${l.ano}`, Number(l.comissao_acumulada) || 0)
  }

  // ── Meta do MÊS SEGUINTE, pra saber se a cobrança deve parar ──
  // "Mês seguinte" é o próximo CICLO, não o próximo mês de calendário: numa
  // barbearia que fecha no dia 26, o ciclo seguinte já tem outro mesRef.
  const { data: metasRaw } = await admin
    .from('metas').select('barbearia_id, mes, ano, meta_coletiva').in('barbearia_id', ids)
  type Meta = { barbearia_id: string; mes: number; ano: number; meta_coletiva: number | null }
  const metaPor = new Set<string>()
  for (const m of (metasRaw ?? []) as Meta[]) {
    if ((Number(m.meta_coletiva) || 0) > 0) metaPor.add(`${m.barbearia_id}|${m.mes}-${m.ano}`)
  }

  // ── Calendário de operação: a barbearia abre HOJE? ──
  const abreHoje = new Map<string, boolean>()
  for (const id of ids) {
    const cfg = barbeariasPorId.get(id)
    const excecoes = await lerExcecoesCalendario(admin, id)
    const dias = calendarioDoPeriodo(agora.dia, agora.dia, {
      diasTrabalhados: (cfg?.dias_trabalhados ?? null) as { dia: string; ativo: boolean }[] | null,
      ...excecoes,
    })
    abreHoje.set(id, dias[0]?.aberto ?? true)
  }

  // ── Monta ──
  const porBarbearia = new Map<string, BarbeariaParaAvisar>()
  for (const id of ids) {
    porBarbearia.set(id, {
      id,
      dono: null,
      barbeiros: [],
      ciclo: ciclosPorBarbearia.get(id)!,
    })
  }

  for (const u of usuarios) {
    const alvo = porBarbearia.get(u.barbearia_id)
    if (!alvo) continue
    const ciclo = alvo.ciclo
    const proximoMes = ciclo.mesRef === 12 ? 1 : ciclo.mesRef + 1
    const proximoAno = ciclo.mesRef === 12 ? ciclo.anoRef + 1 : ciclo.anoRef
    alvo.dono = {
      destino: `dono:${u.id}`,
      lancouHoje: lancouHojePorBarbearia.has(u.barbearia_id),
      diasSeguidosSemLancar: 1,   // preenchido abaixo
      abreHoje: abreHoje.get(u.barbearia_id) ?? true,
      metaProximoMesPronta: metaPor.has(`${u.barbearia_id}|${proximoMes}-${proximoAno}`),
    }
  }

  for (const b of barbeiros) {
    const alvo = porBarbearia.get(b.barbearia_id)
    if (!alvo) continue
    const ciclo = alvo.ciclo
    const camp = campanhaPorBarbearia.get(b.barbearia_id)
    alvo.barbeiros.push({
      destino: `barbeiro:${b.id}`,
      link: b.link_codigo,
      abreHoje: abreHoje.get(b.barbearia_id) ?? true,
      temCampanha: !!camp,
      eleLanca: (camp?.quem_lanca ?? 'barbeiro') !== 'dono',
      lancouHoje: resolveuHoje.has(b.id),
      // Pontos e prêmio exigem a apuração inteira da gamificação, que é cara
      // e por barbearia. Em v1 o aviso de pontos sai sem o número exato — o
      // texto já funciona sem ele —, e o número entra quando a apuração ficar
      // barata o bastante pra rodar de hora em hora.
      faltamPontos: null,
      bateuPontos: false,
      premio: null,
      diasRestantesCiclo: Math.max(0, diasEntre(hoje, ciclo.fim) + 1),
      comissao: comissaoPor.get(`${b.id}|${ciclo.mesRef}-${ciclo.anoRef}`) ?? 0,
      faltaMetaComissao: null,
      servicoExtra: null,
      diferencaComparativo: null,
      labelAnterior: '',
    })
  }

  return Array.from(porBarbearia.values())
}

function diasEntre(de: Date, ate: Date): number {
  const a = new Date(de); a.setHours(0, 0, 0, 0)
  const b = new Date(ate); b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}
