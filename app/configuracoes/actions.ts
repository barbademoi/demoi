'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarLinkCodigo } from '@/lib/utils'

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
