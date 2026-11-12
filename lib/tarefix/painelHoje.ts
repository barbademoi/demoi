import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { dataCurta, diaFechado, hojeSP, somarDias } from '@/lib/tarefix/datas'
import { gerarTarefasDoDia, placar, type Placar } from '@/lib/tarefix/tarefasDia'
import type { Empresa, TarefaDia } from '@/lib/tarefix/tipos'
import { ordenarPorPrazo } from '@/lib/tarefix/prazo'

/**
 * Dados do painel "Hoje" do dono. NÃO é server action: só deve ser chamado
 * depois de exigirDono(), passando a empresa da sessão (tudo é filtrado por ela).
 */

const BUCKET = 'tarefix-provas'

export type TarefaPainel = Pick<TarefaDia, 'id' | 'titulo' | 'descricao' | 'exige_foto' | 'status' | 'feita_em' | 'motivo_reprovacao' | 'horario_inicio' | 'horario_limite' | 'tempo_estimado_min' | 'continua' | 'peso' | 'autoavaliacao'> & {
  foto_url: string | null
}

export type CardColaborador = {
  id: string
  nome: string
  foto_url: string | null
  funcao: string | null
  folga: boolean
  placar: Placar | null
  tarefas: TarefaPainel[]
}

export type ExtraPainel = {
  id: string
  colaborador_id: string
  colaborador: string
  data: string
  descricao: string
  foto_url: string | null
}

export type PainelHoje = {
  hoje: string
  fechado: boolean
  cards: CardColaborador[]
  extrasPendentes: ExtraPainel[]
}

async function assinar(db: ReturnType<typeof createTarefixAdmin>, caminhos: string[]) {
  const urls: Record<string, string> = {}
  const unicos = Array.from(new Set(caminhos))
  if (unicos.length === 0) return urls
  const { data } = await db.storage.from(BUCKET).createSignedUrls(unicos, 60 * 60)
  for (const a of data ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
  return urls
}

export async function carregarPainelHoje(empresa: Empresa): Promise<PainelHoje> {
  const db = createTarefixAdmin()
  const hoje = hojeSP()

  const [{ data: colabs }, { data: funcoes }] = await Promise.all([
    db.from('colaboradores').select('id, empresa_id, nome, foto_url, funcao_id, criado_em').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
    db.from('funcoes').select('id, nome').eq('empresa_id', empresa.id),
  ])
  const lista = colabs ?? []
  const nomeFuncao = Object.fromEntries((funcoes ?? []).map((f) => [f.id, f.nome]))

  // Abrir o dia no painel também gera as tarefas (regra: sem cron).
  await Promise.all(lista.map((c) => gerarTarefasDoDia(c, empresa, hoje, db)))

  const ids = lista.map((c) => c.id)
  const [{ data: tarefas }, { data: folgas }, { data: extras }] = await Promise.all([
    ids.length
      ? db.from('tarefas_dia').select('*').eq('empresa_id', empresa.id).eq('data', hoje).in('colaborador_id', ids)
      : Promise.resolve({ data: [] as TarefaDia[] }),
    db.from('folgas').select('colaborador_id').eq('empresa_id', empresa.id).eq('data', hoje),
    db.from('extras').select('id, colaborador_id, data, descricao, foto_path').eq('empresa_id', empresa.id).eq('status', 'pendente').order('criado_em'),
  ])

  const urls = await assinar(db, [
    ...((tarefas ?? []) as TarefaDia[]).map((t) => t.foto_path).filter((p): p is string => Boolean(p)),
    ...(extras ?? []).map((x) => x.foto_path).filter((p): p is string => Boolean(p)),
  ])
  const emFolga = new Set((folgas ?? []).map((f) => f.colaborador_id))
  const porColab: Record<string, TarefaDia[]> = {}
  for (const t of ordenarPorPrazo((tarefas ?? []) as TarefaDia[])) (porColab[t.colaborador_id] ??= []).push(t)
  const nomeColab = Object.fromEntries(lista.map((c) => [c.id, c.nome]))

  return {
    hoje,
    fechado: diaFechado(hoje, empresa.horario_fechamento),
    cards: lista.map((c) => {
      const ts = porColab[c.id] ?? []
      return {
        id: c.id,
        nome: c.nome,
        foto_url: c.foto_url,
        funcao: c.funcao_id ? nomeFuncao[c.funcao_id] ?? null : null,
        folga: emFolga.has(c.id),
        placar: placar(ts),
        tarefas: ts.map((t) => ({
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
        })),
      }
    }),
    extrasPendentes: (extras ?? [])
      .filter((x) => nomeColab[x.colaborador_id]) // só de colaboradores ativos
      .map((x) => ({
        id: x.id,
        colaborador_id: x.colaborador_id,
        colaborador: nomeColab[x.colaborador_id],
        data: x.data,
        descricao: x.descricao,
        foto_url: x.foto_path ? urls[x.foto_path] ?? null : null,
      })),
  }
}

/**
 * Resumo diário "preguiçoso" (sem cron): na primeira abertura do painel depois
 * do fechamento, grava o aviso "Fechamento 12/11: Ana 100%, João 70%".
 * Se hoje ainda não fechou, garante o de ontem (caso ninguém tenha aberto).
 * A chave única impede duplicar.
 */
export async function garantirResumoDiario(empresa: Empresa) {
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const dia = diaFechado(hoje, empresa.horario_fechamento) ? hoje : somarDias(hoje, -1)
  const chave = `fechamento:${dia}`

  const { data: existe } = await db.from('avisos').select('id').eq('empresa_id', empresa.id).eq('chave', chave).maybeSingle()
  if (existe) return

  const { data: colabs } = await db.from('colaboradores').select('id, empresa_id, nome, criado_em').eq('empresa_id', empresa.id).eq('ativo', true).order('nome')
  const lista = colabs ?? []
  if (lista.length === 0) return
  // Garante as tarefas do dia (se ninguém abriu, geramos agora com as regras de dia fechado).
  await Promise.all(lista.map((c) => gerarTarefasDoDia(c, empresa, dia, db)))
  const { data: tarefas } = await db.from('tarefas_dia').select('colaborador_id, status, peso').eq('empresa_id', empresa.id).eq('data', dia)
  const porColab: Record<string, { status: TarefaDia['status']; peso?: number | null }[]> = {}
  for (const t of tarefas ?? []) (porColab[t.colaborador_id] ??= []).push(t)

  const partes = lista
    .map((c) => ({ nome: c.nome.split(' ')[0], p: placar(porColab[c.id] ?? []) }))
    .filter((x) => x.p)
    .map((x) => `${x.nome} ${x.p!.percentual}%`)
  if (partes.length === 0) return

  await db
    .from('avisos')
    .upsert(
      { empresa_id: empresa.id, tipo: 'fechamento_dia', texto: `Fechamento ${dataCurta(dia)}: ${partes.join(', ')}`, link: '/tarefix/painel', chave },
      { onConflict: 'empresa_id,chave', ignoreDuplicates: true }
    )
}

export async function contarAvisosNaoLidos(empresaId: string): Promise<number> {
  const { count } = await createTarefixAdmin().from('avisos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('lido', false)
  return count ?? 0
}
