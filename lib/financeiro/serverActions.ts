'use server'

// Server action: importa os barbeiros + comissao_acumulada do ciclo atual
// pra dentro do Controle Financeiro. Cada barbeiro vira/atualiza um
// colaborador tipo 'comissao' (so na Empresa) com o valor do mes.
//
// Retorna lista de barbeiros + comissao do ciclo atual. O lado client mescla
// com os collaborators existentes do state e salva via remoteSave.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cicloAtual } from '@/lib/ciclo'
import { estaFechado } from '@/lib/mesFechado'
import { valorBase, type ModoMeta, type BaseMeta } from '@/lib/modoMeta'
import { mesAnoDoYm, normalizarValor, linhaLancamentoAjuste } from '@/lib/financeiro/comissaoBruta'

interface BarbeiroComissao {
  /** id do barbeiro no BarberMeta — a chave pra escrever de volta em lancamentos. */
  id: string
  nome: string
  comissao: number
}

export async function buscarComissoesBarbermeta(): Promise<
  { ok: true; mesAno: string; barbeiros: BarbeiroComissao[] } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(dia_fechamento)')
    .eq('id', user.id).single() as
    { data: { barbearia_id: string; barbearias: { dia_fechamento: number | null } | null } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const diaFechamento = usuario.barbearias?.dia_fechamento ?? 1
  const ciclo = cicloAtual(diaFechamento, new Date())
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  // Barbeiros ativos da barbearia (recepcionistas tambem podem ter comissao,
  // entao nao filtra por tipo — quem nao quiser, ignora no lado do app)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bs } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((bs ?? []) as { id: string; nome: string }[])

  if (barbeiros.length === 0) {
    return { ok: true, mesAno: `${ano}-${String(mes).padStart(2, '0')}`, barbeiros: [] }
  }

  // Comissao acumulada do ciclo atual por barbeiro
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ls } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes).eq('ano', ano)
    .in('barbeiro_id', barbeiros.map(b => b.id))
  const porBarbeiro: Record<string, number> = {}
  for (const r of (ls ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    porBarbeiro[r.barbeiro_id] = Number(r.comissao_acumulada) || 0
  }

  const out: BarbeiroComissao[] = barbeiros.map(b => ({
    id: b.id,
    nome: b.nome,
    comissao: porBarbeiro[b.id] ?? 0,
  }))

  return { ok: true, mesAno: `${ano}-${String(mes).padStart(2, '0')}`, barbeiros: out }
}

// Le nome + logo da barbearia do usuario logado. Usado pra montar o card
// de pagamento (PNG) que o dono manda pro colaborador junto com o pagamento.
export async function buscarBarbeariaInfo(): Promise<
  { ok: true; nome: string; logoUrl: string | null } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearias(nome, logo_url)')
    .eq('id', user.id).single() as
    { data: { barbearias: { nome: string; logo_url: string | null } | null } | null }

  if (!usuario?.barbearias) return { error: 'Barbearia não encontrada.' }
  return { ok: true, nome: usuario.barbearias.nome, logoUrl: usuario.barbearias.logo_url }
}

// ───────────────────────────────────────────────────────────────────────────
// EDIÇÃO DA COMISSÃO BRUTA — grava no MESMO lugar que o resto do sistema lê.
// ───────────────────────────────────────────────────────────────────────────
//
// Até aqui, editar a comissão de um colaborador no Financeiro mexia só no
// blob JSON do módulo (financeiro_state). O número do ranking continuava o
// que estava em `lancamentos`, e o auto-sync desta tela sobrescrevia a edição
// na próxima vez que a página abrisse — ou seja, o campo parecia editável e
// não era. Esta action fecha esse buraco: a edição vai para `lancamentos`,
// que é de onde vêm ranking, meta, histórico e o próprio auto-sync.
//
// A régua é a MESMA do lançamento diário (definirAcumuladoMes):
//   - o par (mes, ano) é o do CICLO, não o do calendário nem o de hoje;
//   - `valorBase()` decide se o valor é faturamento ou comissão;
//   - `comissao_acumulada` é o espelho do valor base — é a coluna que o
//     ranking lê;
//   - mês fechado trava a edição.

export interface AjusteComissao {
  id: string
  mes: number
  ano: number
  campo: 'comissao' | 'faturamento'
  valorAnterior: number
  valorNovo: number
  autor: string | null
  criadoEm: string
}

export async function salvarComissaoBrutaBarbeiro(
  barbeiroId: string,
  /** Ciclo alvo no formato 'YYYY-MM' — o mês que o dono está vendo na tela. */
  ym: string,
  valor: number,
): Promise<
  | { ok: true; campo: 'comissao' | 'faturamento'; valorAnterior: number; valorNovo: number; avisoMetaCasa: boolean }
  | { error: string }
> {
  const alvo = mesAnoDoYm(ym)
  if (!alvo) return { error: 'Mês inválido.' }
  const valorNovo = normalizarValor(valor)
  if (valorNovo === null) return { error: 'Valor inválido.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Só o dono chega aqui: `usuarios` é a tabela do dono, e todas as escritas
  // abaixo passam pela RLS por barbearia. É o mesmo controle do resto do
  // Financeiro — não há caminho de barbeiro para esta action.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(modo_meta, base_meta)')
    .eq('id', user.id).single() as
    { data: { barbearia_id: string; barbearias: { modo_meta: string | null; base_meta: string | null } | null } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const { barbearia_id } = usuario
  const { mes, ano } = alvo

  // O barbeiro tem que ser DESTA barbearia. A RLS já barraria a escrita, mas
  // sem esta checagem um id de fora viraria um upsert silenciosamente vazio e
  // uma linha de auditoria mentirosa.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome')
    .eq('id', barbeiroId)
    .eq('barbearia_id', barbearia_id)
    .maybeSingle() as { data: { id: string; nome: string } | null }
  if (!barbeiro) return { error: 'Barbeiro não encontrado nesta barbearia.' }

  const trava = await estaFechado(supabase, barbearia_id, mes, ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de editar.' }

  const base: BaseMeta = valorBase(
    (usuario.barbearias?.modo_meta ?? null) as ModoMeta | null,
    (usuario.barbearias?.base_meta ?? null) as BaseMeta | null,
  )

  // Valor de antes, pra auditoria. `comissao_acumulada` é o número que o
  // ranking usa — é ele que o histórico precisa comparar.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: atual } = await (supabase as any)
    .from('lancamentos')
    .select('comissao_acumulada, numero_atendimentos')
    .eq('barbearia_id', barbearia_id)
    .eq('barbeiro_id', barbeiroId)
    .eq('mes', mes).eq('ano', ano)
    .maybeSingle() as { data: { comissao_acumulada: number | string | null; numero_atendimentos: number | string | null } | null }

  const valorAnterior = Number(atual?.comissao_acumulada) || 0

  const row = linhaLancamentoAjuste({
    base, barbeariaId: barbearia_id, barbeiroId, mes, ano, valor: valorNovo,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errLanc } = await (supabase as any)
    .from('lancamentos')
    .upsert(row, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })
  if (errLanc) return { error: (errLanc as { message: string }).message }

  // ── Auditoria ──
  // Gravada DEPOIS do upsert, de propósito: registrar um ajuste que não foi
  // aplicado seria pior do que não registrar. Se a auditoria falhar, o ajuste
  // continua valendo e o erro sobe no log — nunca desfazemos o valor por causa
  // do rastro.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errAudit } = await (supabase as any)
    .from('ajustes_comissao')
    .insert({
      barbearia_id,
      barbeiro_id: barbeiroId,
      mes,
      ano,
      campo: base,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      origem: 'financeiro',
      usuario_id: user.id,
    })
  if (errAudit) console.error('[financeiro] auditoria do ajuste de comissão:', errAudit)

  // O total da casa (metas.faturamento_acumulado) é digitado à parte pelo dono
  // na tela de lançamento e pode incluir receita que não passa por barbeiro.
  // Por isso NÃO é recalculado aqui. Quando ele está zerado, o dashboard soma
  // as comissões e a edição aparece sozinha; quando está preenchido, ele manda,
  // e a tela avisa o dono em vez de mexer num número que é dele.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('faturamento_acumulado')
    .eq('barbearia_id', barbearia_id)
    .eq('mes', mes).eq('ano', ano)
    .maybeSingle() as { data: { faturamento_acumulado: number | string | null } | null }

  const avisoMetaCasa = (Number(metaRaw?.faturamento_acumulado) || 0) > 0

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  revalidatePath('/dashboard/financeiro')

  return { ok: true, campo: base, valorAnterior, valorNovo, avisoMetaCasa }
}

/** Últimos ajustes manuais de um barbeiro num ciclo — o histórico da tela. */
export async function listarAjustesComissao(
  barbeiroId: string,
  ym: string,
): Promise<{ ok: true; ajustes: AjusteComissao[] } | { error: string }> {
  const alvo = mesAnoDoYm(ym)
  if (!alvo) return { error: 'Mês inválido.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from('ajustes_comissao')
    .select('id, mes, ano, campo, valor_anterior, valor_novo, criado_em, usuario_id')
    .eq('barbeiro_id', barbeiroId)
    .eq('mes', alvo.mes).eq('ano', alvo.ano)
    .order('criado_em', { ascending: false })
    .limit(20)
  if (error) return { error: (error as { message: string }).message }

  type Row = {
    id: string; mes: number; ano: number; campo: 'comissao' | 'faturamento'
    valor_anterior: number | string; valor_novo: number | string
    criado_em: string; usuario_id: string | null
  }
  const lista = (rows ?? []) as Row[]

  // Quem editou. `usuarios` só guarda o e-mail (não há coluna de nome), e a
  // RLS já limita a leitura ao próprio dono — na prática é sempre ele. Resolver
  // mesmo assim deixa o histórico legível se a barbearia passar a ter mais de
  // um login.
  const ids = Array.from(new Set(lista.map(r => r.usuario_id).filter((v): v is string => !!v)))
  const nomes = new Map<string, string>()
  if (ids.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: us } = await (supabase as any)
      .from('usuarios').select('id, email').in('id', ids) as
      { data: { id: string; email: string | null }[] | null }
    for (const u of us ?? []) if (u.email) nomes.set(u.id, u.email)
  }

  return {
    ok: true,
    ajustes: lista.map(r => ({
      id: r.id,
      mes: r.mes,
      ano: r.ano,
      campo: r.campo,
      valorAnterior: Number(r.valor_anterior) || 0,
      valorNovo: Number(r.valor_novo) || 0,
      autor: r.usuario_id ? (nomes.get(r.usuario_id) ?? null) : null,
      criadoEm: r.criado_em,
    })),
  }
}
