'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { RegraConduta } from '@/types/database'

// Todas as ações abaixo são EXCLUSIVAS DO DONO. A leitura/escrita passa pelo
// client autenticado (anon key + sessão) e a RLS (barbearia_id =
// get_barbearia_id()) garante o isolamento por barbearia. Filtramos também
// por barbearia_id na mão como defesa em profundidade.
async function getBarbeariaId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  return (data as { barbearia_id: string } | null)?.barbearia_id ?? null
}

function parseValor(raw: FormDataEntryValue | null): number {
  const n = parseFloat(String(raw ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

// ── Toggle geral do módulo (default OFF) ─────────────────────────────────────
export async function toggleComportamento(ativo: boolean) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update({ comportamento_ativo: ativo }).eq('id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

// ── Regras de conduta ────────────────────────────────────────────────────────
export async function criarRegra(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const nome = (formData.get('nome') as string ?? '').trim().slice(0, 80)
  const valor = parseValor(formData.get('valor'))
  if (!nome) return { error: 'Dê um nome pra regra.' }

  // Retorna a linha criada (com o id REAL) pra o client não precisar de um id
  // temporário — assim a regra recém-criada já pode receber ocorrência sem
  // exigir reload da página.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regra, error } = await (supabase as any)
    .from('regras_conduta')
    .insert({ barbearia_id: barbeariaId, nome, valor, ativo: true })
    .select('id, barbearia_id, nome, valor, ativo, created_at')
    .single()
  if (error || !regra) return { error: 'Erro ao criar regra.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true, regra: regra as RegraConduta }
}

export async function atualizarRegra(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string ?? '').trim().slice(0, 80)
  const valor = parseValor(formData.get('valor'))
  if (!id || !nome) return { error: 'Dados inválidos.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .update({ nome, valor })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

export async function toggleRegraAtiva(id: string, ativo: boolean) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .update({ ativo })
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

export async function excluirRegra(id: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('regras_conduta')
    .delete()
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao excluir.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

// ── Ocorrências ──────────────────────────────────────────────────────────────
// O dono seleciona um barbeiro e uma regra (ou lança um ajuste avulso com
// descrição e valor). `valor` é gravado como SNAPSHOT (não muda se a regra
// mudar depois). `descricao` guarda o nome da regra no momento (ou o texto
// avulso), pra o histórico ficar legível mesmo se a regra for editada/apagada.
export async function registrarOcorrencia(formData: FormData) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const barbeiro_id = (formData.get('barbeiro_id') as string ?? '').trim()
  const regraIdRaw  = (formData.get('regra_id') as string ?? '').trim()
  const data        = (formData.get('data') as string ?? '').trim()
  if (!barbeiro_id) return { error: 'Escolha um barbeiro.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: 'Data inválida.' }

  // Barbeiro precisa ser da própria barbearia (defesa; RLS também protege).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barb } = await (supabase as any)
    .from('barbeiros').select('id').eq('id', barbeiro_id).eq('barbearia_id', barbeariaId).single()
  if (!barb) return { error: 'Barbeiro inválido.' }

  let regra_id: string | null = null
  let descricao: string | null = null
  let valor = 0

  if (regraIdRaw && regraIdRaw !== 'avulso') {
    // Regra existente: snapshot de nome + valor.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: regra } = await (supabase as any)
      .from('regras_conduta').select('id, nome, valor')
      .eq('id', regraIdRaw).eq('barbearia_id', barbeariaId).single()
    if (!regra) return { error: 'Regra inválida.' }
    regra_id = regra.id
    descricao = regra.nome
    valor = Number(regra.valor) || 0
  } else {
    // Ajuste avulso.
    descricao = (formData.get('descricao') as string ?? '').trim().slice(0, 120)
    valor = parseValor(formData.get('valor'))
    if (!descricao) return { error: 'Descreva o ajuste avulso.' }
    if (valor === 0) return { error: 'Informe um valor diferente de zero.' }
  }

  // Observação opcional do dono — será exibida ao barbeiro.
  const observacao = (formData.get('observacao') as string ?? '').trim().slice(0, 500) || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ocorrencias_conduta')
    .insert({ barbearia_id: barbeariaId, barbeiro_id, regra_id, descricao, valor, observacao, data })
  if (error) return { error: 'Erro ao registrar.' }

  revalidatePath('/dashboard/comportamento')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}

export async function excluirOcorrencia(id: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ocorrencias_conduta')
    .delete()
    .eq('id', id)
    .eq('barbearia_id', barbeariaId)
  if (error) return { error: 'Erro ao excluir.' }

  revalidatePath('/dashboard/comportamento')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}

// ── Mensagens (lado do dono) ─────────────────────────────────────────────────
// Dono marca uma mensagem do barbeiro como lida (sai do alerta na caixa).
export async function marcarMensagemLidaDono(mensagemId: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mensagens_conduta')
    .update({ lida_em: new Date().toISOString() })
    .eq('id', mensagemId)
    .eq('barbearia_id', barbeariaId)
    .eq('autor', 'barbeiro')   // dono só lê mensagem do barbeiro
    .is('lida_em', null)
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/dashboard/comportamento')
  return { ok: true }
}

// Dono responde uma conversa IDENTIFICADA. Responder já marca as mensagens do
// barbeiro na thread como lidas. Anônimas não têm thread respondível.
export async function responderMensagem(threadId: string, corpoRaw: string) {
  const supabase = createClient()
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }
  const corpo = (corpoRaw ?? '').trim().slice(0, 1000)
  if (!corpo) return { error: 'Escreva uma resposta.' }

  // A thread precisa ser desta barbearia e NÃO ser anônima. Pega o barbeiro_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: base } = await (supabase as any)
    .from('mensagens_conduta')
    .select('barbeiro_id, anonima')
    .eq('thread_id', threadId)
    .eq('barbearia_id', barbeariaId)
    .eq('autor', 'barbeiro')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!base) return { error: 'Conversa não encontrada.' }
  if (base.anonima) return { error: 'Mensagem anônima não pode ser respondida.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mensagens_conduta')
    .insert({
      barbearia_id: barbeariaId,
      barbeiro_id: base.barbeiro_id,
      thread_id: threadId,
      autor: 'dono',
      anonima: false,
      corpo,
    })
  if (error) return { error: 'Erro ao responder.' }

  // Responder implica leitura das mensagens do barbeiro na thread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('mensagens_conduta')
    .update({ lida_em: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('barbearia_id', barbeariaId)
    .eq('autor', 'barbeiro')
    .is('lida_em', null)

  revalidatePath('/dashboard/comportamento')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}
