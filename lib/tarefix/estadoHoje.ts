import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { anoMesDe, diaFechado, hojeSP, minutosParaFechamento } from '@/lib/tarefix/datas'
import { gerarELerMes, gerarTarefasDoDia, lerDia, lerMes, placar, type Placar } from '@/lib/tarefix/tarefasDia'
import type { Colaborador, Empresa } from '@/lib/tarefix/tipos'

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
}

export type Ctx = { colaborador: Colaborador; empresa: Empresa }

export async function montarEstado({ colaborador, empresa }: Ctx, gerar: boolean): Promise<EstadoHoje> {
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const anoMes = anoMesDe(hoje)

  // Ao abrir a tela: gera o mês todo até hoje (inclui hoje). Depois de uma ação: só lê.
  const resumoMes = gerar ? await gerarELerMes(colaborador, empresa, anoMes, db) : await lerMes(colaborador.id, anoMes, db)
  if (!gerar) await gerarTarefasDoDia(colaborador, empresa, hoje, db)

  const [linhas, { data: folga }, { data: extras }] = await Promise.all([
    lerDia(colaborador.id, hoje, db),
    db.from('folgas').select('id').eq('colaborador_id', colaborador.id).eq('data', hoje).maybeSingle(),
    db.from('extras').select('id, descricao, status').eq('colaborador_id', colaborador.id).eq('data', hoje).order('criado_em'),
  ])

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
    folga: Boolean(folga),
    tarefas: linhas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      exige_foto: t.exige_foto,
      status: t.status,
      feita_em: t.feita_em,
      motivo_reprovacao: t.motivo_reprovacao,
      foto_url: t.foto_path ? urls[t.foto_path] ?? null : null,
    })),
    dia: placar(linhas),
    mes: resumoMes.placar,
    extrasHoje: (extras ?? []) as ExtraTela[],
    extrasAprovadasMes: resumoMes.extrasAprovadas,
  }
}

