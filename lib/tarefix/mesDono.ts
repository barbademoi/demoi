import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { anoMesDe, datasDoMes, hojeSP } from '@/lib/tarefix/datas'
import { gerarTarefasPeriodo, lerMes, type Placar } from '@/lib/tarefix/tarefasDia'
import { niveisOrdenados, situacaoBonus, type SituacaoBonus } from '@/lib/tarefix/bonus'
import type { Empresa, NivelBonus } from '@/lib/tarefix/tipos'

/**
 * Mês no painel do dono. NÃO é server action: chamar só depois de exigirDono(),
 * com a empresa da sessão.
 */

export type LinhaMes = {
  colaborador_id: string
  nome: string
  foto_url: string | null
  ativo: boolean
  placar: Placar | null
  extrasAprovadas: number
  bonus: SituacaoBonus | null
}

export type ResumoMesDono = {
  anoMes: string
  atual: boolean // é o mês corrente (ainda não pode fechar)
  fechado: { fechado_em: string } | null
  bonusAtivo: boolean
  niveis: NivelBonus[]
  linhas: LinhaMes[]
}

/** Meses disponíveis: do cadastro da empresa até o mês atual (mais recente primeiro). */
export function mesesDisponiveis(empresa: Empresa): string[] {
  const fim = anoMesDe(hojeSP())
  let m = anoMesDe(empresa.criado_em.slice(0, 10))
  const out: string[] = []
  while (m <= fim && out.length < 120) {
    out.push(m)
    const [a, mm] = m.split('-').map(Number)
    m = mm === 12 ? `${a + 1}-01` : `${a}-${String(mm + 1).padStart(2, '0')}`
  }
  return out.reverse()
}

export async function carregarMesDono(empresa: Empresa, anoMes: string): Promise<ResumoMesDono> {
  const db = createTarefixAdmin()
  const atual = anoMes === anoMesDe(hojeSP())

  const [{ data: colabs }, { data: bonusCfg }, { data: fechados }] = await Promise.all([
    db.from('colaboradores').select('id, empresa_id, nome, foto_url, ativo, criado_em').eq('empresa_id', empresa.id).order('nome'),
    db.from('bonus_config').select('*').eq('empresa_id', empresa.id).maybeSingle(),
    db.from('meses_fechados').select('*').eq('empresa_id', empresa.id).eq('ano_mes', anoMes),
  ])
  const niveis = niveisOrdenados(bonusCfg?.niveis)
  const bonusAtivo = Boolean(bonusCfg?.ativo && niveis.length)

  // Mês já fechado: mostra o que foi gravado no fechamento.
  if (fechados && fechados.length) {
    const porId = Object.fromEntries((colabs ?? []).map((c) => [c.id, c]))
    return {
      anoMes,
      atual,
      fechado: { fechado_em: fechados[0].fechado_em },
      bonusAtivo,
      niveis,
      linhas: fechados
        .map((f) => ({
          colaborador_id: f.colaborador_id,
          nome: porId[f.colaborador_id]?.nome ?? '—',
          foto_url: porId[f.colaborador_id]?.foto_url ?? null,
          ativo: porId[f.colaborador_id]?.ativo ?? false,
          placar: { feitas: 0, total: 0, percentual: Math.round(Number(f.percentual_final)) },
          extrasAprovadas: f.extras_aprovadas,
          bonus: f.bonus_atingido ? { niveis, atingido: f.bonus_atingido, proximo: null, falta: null } : null,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    }
  }

  // Aberto: garante os dias dos ATIVOS (inativos só têm o histórico que já existe).
  const ate = datasDoMes(anoMes, hojeSP())
  await Promise.all((colabs ?? []).filter((c) => c.ativo).map((c) => gerarTarefasPeriodo(c, empresa, ate, db)))

  const linhas: LinhaMes[] = []
  for (const c of colabs ?? []) {
    const r = await lerMes(c.id, anoMes, db)
    if (!c.ativo && !r.placar) continue // inativo sem nada no mês: some da lista
    linhas.push({
      colaborador_id: c.id,
      nome: c.nome,
      foto_url: c.foto_url,
      ativo: c.ativo,
      placar: r.placar,
      extrasAprovadas: r.extrasAprovadas,
      bonus: bonusAtivo ? situacaoBonus(niveis, r.placar?.percentual ?? null) : null,
    })
  }
  return { anoMes, atual, fechado: null, bonusAtivo, niveis, linhas }
}
