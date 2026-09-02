'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarLinkCodigo } from '@/lib/utils'
import {
  TABELAS_EM_CASCATA,
  confirmacaoConfere,
  podeExcluir,
  totalDoInventario,
  type CicloComDado,
  type Inventario,
} from '@/lib/equipe/exclusaoBarbeiro'

async function getBarbeariaId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  return (data as { barbearia_id: string } | null)?.barbearia_id ?? null
}

export async function salvarIdentidadeConfig(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const nome = (formData.get('nome') as string).trim().slice(0, 60)
  const cidade = (formData.get('cidade') as string).trim()
  const cor_principal = (formData.get('cor_principal') as string) || '#2563EB'
  if (!nome || !cidade) return { error: 'Nome e cidade são obrigatórios.' }

  const updates: Record<string, unknown> = { nome, cidade, cor_principal }

  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    try {
      const admin = createAdminClient()
      const ext = logoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `logos/${barbeariaId}/logo.${ext}`
      const bytes = await logoFile.arrayBuffer()
      await admin.storage.from('fotos').upload(path, bytes, { upsert: true, contentType: logoFile.type })
      const { data: { publicUrl } } = admin.storage.from('fotos').getPublicUrl(path)
      updates.logo_url = publicUrl
    } catch (err) {
      console.error('[configuracoes] erro upload logo:', err)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('barbearias').update(updates).eq('id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard')
  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function salvarOperacaoConfig(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
  const dias_trabalhados = DIAS.map(dia => ({
    dia,
    ativo: formData.get(`dia_${dia}`) === 'on',
  }))
  const horario_abertura = formData.get('horario_abertura') as string || '09:00'
  const horario_fechamento = formData.get('horario_fechamento') as string || '20:00'
  const modalidade = formData.get('modalidade') as string
  const tem_assinatura = formData.get('tem_assinatura') === 'true'

  const visibilidadeRaw = (formData.get('visibilidade_ranking') as string) || 'completo'
  const visibilidade_ranking = (['completo', 'posicoes', 'proprio'].includes(visibilidadeRaw)
    ? visibilidadeRaw
    : 'completo')

  const diaFechRaw = parseInt((formData.get('dia_fechamento') as string) || '1', 10)
  const dia_fechamento = Math.min(28, Math.max(1, isNaN(diaFechRaw) ? 1 : diaFechRaw))

  const mostrar_ticket_medio = formData.get('mostrar_ticket_medio') === 'true'
  const mostrar_faturamento_geral = formData.get('mostrar_faturamento_geral') === 'true'

  // Dias de trabalho padrão da barbearia (base do ritmo pra quem folga).
  // Vazio → NULL = comportamento atual (cálculo por dias úteis do ciclo).
  const diasTrabRaw = (formData.get('dias_trabalho_padrao') as string ?? '').trim()
  const diasTrabParsed = parseInt(diasTrabRaw, 10)
  const dias_trabalho_padrao = diasTrabRaw !== '' && Number.isFinite(diasTrabParsed)
    ? Math.min(31, Math.max(1, diasTrabParsed))
    : null

  // Piso mínimo de faturamento no ciclo anterior pra concorrer à Maior Evolução.
  // Vazio/invalido → 500 (default). 0 = sem piso.
  const evoMinRaw = (formData.get('evolucao_faturamento_minimo') as string ?? '').trim().replace(',', '.')
  const evoMinParsed = parseFloat(evoMinRaw)
  const evolucao_faturamento_minimo = evoMinRaw !== '' && Number.isFinite(evoMinParsed)
    ? Math.max(0, evoMinParsed)
    : 500

  // Obs.: modo_meta / base_meta NÃO são salvos aqui. A escolha "Sua meta é
  // baseada em" mora agora na configuração de metas (MetasModal). Não tocar
  // nesses campos aqui preserva o valor já salvo ao salvar a aba Operação.

  console.log('[salvarOperacaoConfig]', { barbeariaId, visibilidade_ranking, modalidade, dia_fechamento, mostrar_ticket_medio, mostrar_faturamento_geral })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias')
    .update({
      mostrar_ticket_medio,
      mostrar_faturamento_geral,
      dias_trabalho_padrao,
      evolucao_faturamento_minimo,
      dias_trabalhados, horario_abertura, horario_fechamento, modalidade, tem_assinatura,
      visibilidade_ranking, dia_fechamento,
    })
    .eq('id', barbeariaId)

  if (error) {
    console.error('[salvarOperacaoConfig] erro:', error)
    return { error: 'Erro ao salvar.' }
  }
  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  // Revalida todas as telas de barbeiro (visibilidade do ranking muda aqui)
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}

export async function adicionarBarbeiroConfig(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome obrigatório.' }
  const foto_url = (formData.get('foto_url') as string) || null
  const tipo = (formData.get('tipo') as string) === 'recepcionista' ? 'recepcionista' : 'barbeiro'
  const dias_trabalho_mes = parseDiasTrabalho(formData.get('dias_trabalho_mes') as string | null)

  const admin = createAdminClient()
  let link_codigo = ''
  for (let i = 0; i < 5; i++) {
    const candidato = gerarLinkCodigo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existe } = await (admin as any)
      .from('barbeiros').select('id').eq('link_codigo', candidato).single()
    if (!existe) { link_codigo = candidato; break }
  }
  if (!link_codigo) return { error: 'Tente novamente.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('barbeiros')
    .insert({ barbearia_id: barbeariaId, nome, link_codigo, foto_url, tipo, dias_trabalho_mes })

  if (error) return { error: 'Erro ao adicionar.' }
  revalidatePath('/configuracoes')
  return { ok: true }
}

// Parseia o campo "Dias que vai trabalhar no mês". Vazio → null (herda o
// padrão da barbearia). Faixa 1..31.
function parseDiasTrabalho(raw: string | null): number | null {
  const s = (raw ?? '').trim()
  if (s === '') return null
  const n = parseInt(s, 10)
  if (!Number.isFinite(n)) return null
  return Math.min(31, Math.max(1, n))
}

// Atualiza só os dias de trabalho de um barbeiro (edição inline na Equipe).
export async function atualizarDiasBarbeiroConfig(id: string, diasRaw: string | null) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const dias_trabalho_mes = parseDiasTrabalho(diasRaw)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbeiros')
    .update({ dias_trabalho_mes })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)

  if (error) return { error: 'Erro ao salvar.' }
  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true, dias_trabalho_mes }
}

export async function desativarBarbeiroConfig(id: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('barbeiros')
    .update({ ativo: false })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)

  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function reativarBarbeiroConfig(id: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('barbeiros')
    .update({ ativo: true })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)

  revalidatePath('/configuracoes')
  return { ok: true }
}

// ───────────────────────────────────────────────────────────────────────────
// EXCLUSÃO DEFINITIVA DE UM PROFISSIONAL
// ───────────────────────────────────────────────────────────────────────────
//
// Desativar continua sendo a saída certa para quem foi demitido: o barbeiro
// sai das telas e o que ele faturou continua no histórico da barbearia.
// Excluir é para o cadastro que não deveria existir — nome duplicado, digitado
// errado, teste que ficou.
//
// A exclusão é IRREVERSÍVEL e leva junto, pelo cascade das chaves
// estrangeiras, tudo que estava pendurado no barbeiro. Por isso ela acontece
// em duas etapas: primeiro a tela mostra exatamente o que será apagado, depois
// o dono confirma digitando o nome.

/**
 * O que a exclusão apagaria, e se ela é permitida.
 *
 * Nada é alterado aqui — é a prévia que a tela mostra antes de perguntar.
 */
export async function inventarioExclusaoBarbeiro(id: string): Promise<
  | { ok: true; nome: string; inventario: Inventario; bloqueio: string | null }
  | { error: string }
> {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // O barbeiro tem que ser DESTA barbearia. A RLS já barraria, mas sem a
  // checagem um id de fora devolveria um inventário vazio — que na tela
  // pareceria "não há nada a perder".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros').select('id, nome')
    .eq('id', id).eq('barbearia_id', barbeariaId).maybeSingle() as
    { data: { id: string; nome: string } | null }
  if (!barbeiro) return { error: 'Profissional não encontrado nesta barbearia.' }

  // Conta linha por tabela. `head: true` traz só o total, sem baixar os dados.
  const contagens = await Promise.all(
    TABELAS_EM_CASCATA.map(async (t) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from(t.tabela).select('id', { count: 'exact', head: true })
        .eq('barbeiro_id', id)
      // Uma tabela que ainda não existe no ambiente não pode derrubar a
      // prévia inteira — ela simplesmente não tem nada a apagar.
      if (error) return [t.tabela, 0] as const
      return [t.tabela, Number(count) || 0] as const
    }),
  )
  const inventario = Object.fromEntries(contagens) as Inventario

  // Meses fechados COM lançamento deste barbeiro — o único bloqueio.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: lancs }, { data: fechados }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('lancamentos').select('mes, ano')
      .eq('barbearia_id', barbeariaId).eq('barbeiro_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('meses_fechados').select('mes, ano')
      .eq('barbearia_id', barbeariaId),
  ])
  const chavesFechadas = new Set(
    ((fechados ?? []) as CicloComDado[]).map((c) => `${c.mes}/${c.ano}`),
  )
  const fechadosComDado = ((lancs ?? []) as CicloComDado[])
    .filter((l) => chavesFechadas.has(`${l.mes}/${l.ano}`))
  const veredito = podeExcluir(fechadosComDado)

  return {
    ok: true,
    nome: barbeiro.nome,
    inventario,
    bloqueio: veredito.ok ? null : veredito.motivo,
  }
}

/**
 * Exclui o profissional de vez.
 *
 * `nomeDigitado` tem que bater com o nome cadastrado — é a última barreira
 * antes de algo que não tem volta. A conferência é feita AQUI, no servidor, e
 * não só na tela: uma validação que mora apenas no cliente não é validação.
 */
export async function excluirBarbeiroConfig(id: string, nomeDigitado: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const { data: { user } } = await supabase.auth.getUser()

  // Reapura tudo na hora da exclusão, e não confia no que a tela mandou: entre
  // a prévia e o clique o dono pode ter fechado o mês em outra aba.
  const previa = await inventarioExclusaoBarbeiro(id)
  if ('error' in previa) return previa
  if (previa.bloqueio) return { error: previa.bloqueio }
  if (!confirmacaoConfere(nomeDigitado, previa.nome)) {
    return { error: 'O nome digitado não confere com o do profissional.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros').select('id, nome, tipo')
    .eq('id', id).eq('barbearia_id', barbeariaId).maybeSingle() as
    { data: { id: string; nome: string; tipo: string | null } | null }
  if (!barbeiro) return { error: 'Profissional não encontrado nesta barbearia.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errDelete } = await (supabase as any)
    .from('barbeiros').delete()
    .eq('id', id).eq('barbearia_id', barbeariaId)
  if (errDelete) return { error: 'Não foi possível excluir. Nada foi alterado.' }

  // O rastro vai DEPOIS do delete: registrar uma exclusão que não aconteceu
  // seria pior que não registrar. Se ele falhar, o barbeiro já foi (não há como
  // desfazer) e o erro sobe no log — nunca o contrário.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errAudit } = await (supabase as any)
    .from('barbeiros_excluidos')
    .insert({
      barbearia_id: barbeariaId,
      barbeiro_id: id,
      nome: barbeiro.nome,
      tipo: barbeiro.tipo,
      apagados: previa.inventario,
      excluido_por: user?.id ?? null,
    })
  if (errAudit) console.error('[configuracoes] rastro da exclusão do barbeiro:', errAudit)

  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/brindoleta')
  return { ok: true, nome: barbeiro.nome, apagados: totalDoInventario(previa.inventario) }
}
