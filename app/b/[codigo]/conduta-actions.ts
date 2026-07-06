'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Ações do BARBEIRO na tela pública /b/[codigo]. O barbeiro não é autenticado
// no Supabase — ele é identificado pelo link_codigo secreto. Por isso usamos o
// admin client (service role) e ESCOPAMOS TUDO por barbeiro_id resolvido do
// link. Assim o barbeiro só mexe no que é dele: sem o link do outro, não há
// como agir sobre a conduta/mensagens de outro barbeiro. As tabelas seguem com
// RLS só-dono (nenhum acesso anônimo direto).
async function resolverBarbeiro(linkCodigo: string) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('barbeiros')
    .select('id, barbearia_id, nome')
    .eq('link_codigo', linkCodigo)
    .eq('ativo', true)
    .single()
  return data as { id: string; barbearia_id: string; nome: string } | null
}

// Barbeiro dá ciência ("Li e estou ciente") de uma ocorrência DELE.
export async function marcarOcorrenciaCiente(linkCodigo: string, ocorrenciaId: string) {
  const barb = await resolverBarbeiro(linkCodigo)
  if (!barb) return { error: 'Barbeiro não encontrado.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('ocorrencias_conduta')
    .update({ ciente_em: new Date().toISOString() })
    .eq('id', ocorrenciaId)
    .eq('barbeiro_id', barb.id)   // escopo: só ocorrência dele
    .is('ciente_em', null)
  if (error) return { error: 'Erro ao confirmar.' }

  revalidatePath('/b/' + linkCodigo)
  return { ok: true }
}

// Barbeiro envia mensagem ao dono (identificada ou anônima). Identificada
// inicia/continua uma thread; anônima é sempre mão única (thread própria).
export async function enviarMensagemBarbeiro(params: {
  linkCodigo: string
  corpo: string
  anonima: boolean
  threadId?: string   // continuar uma conversa identificada existente
}) {
  const barb = await resolverBarbeiro(params.linkCodigo)
  if (!barb) return { error: 'Barbeiro não encontrado.' }
  const corpo = (params.corpo ?? '').trim().slice(0, 1000)
  if (!corpo) return { error: 'Escreva uma mensagem.' }

  const admin = createAdminClient()
  // Continuar thread identificada só é permitido se a thread é do próprio
  // barbeiro e não é anônima. Caso contrário, abre thread nova.
  let threadId: string | null = null
  if (params.threadId && !params.anonima) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: t } = await (admin as any)
      .from('mensagens_conduta')
      .select('thread_id')
      .eq('thread_id', params.threadId)
      .eq('barbeiro_id', barb.id)
      .eq('anonima', false)
      .limit(1)
      .maybeSingle()
    if (t) threadId = params.threadId
  }

  // Insere primeiro sem thread pra obter o id, e usa o próprio id como thread
  // quando é uma conversa nova (ou anônima).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserida, error } = await (admin as any)
    .from('mensagens_conduta')
    .insert({
      barbearia_id: barb.barbearia_id,
      barbeiro_id: barb.id,
      thread_id: threadId ?? '00000000-0000-0000-0000-000000000000',
      autor: 'barbeiro',
      anonima: params.anonima,
      corpo,
    })
    .select('id')
    .single()
  if (error || !inserida) return { error: 'Erro ao enviar.' }

  if (!threadId) {
    // Nova conversa: thread_id = id da própria mensagem.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('mensagens_conduta')
      .update({ thread_id: inserida.id })
      .eq('id', inserida.id)
  }

  revalidatePath('/b/' + params.linkCodigo)
  return { ok: true }
}

// Barbeiro dá check de leitura numa resposta do dono (mensagem autor='dono').
export async function marcarMensagemLidaBarbeiro(linkCodigo: string, mensagemId: string) {
  const barb = await resolverBarbeiro(linkCodigo)
  if (!barb) return { error: 'Barbeiro não encontrado.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('mensagens_conduta')
    .update({ lida_em: new Date().toISOString() })
    .eq('id', mensagemId)
    .eq('barbeiro_id', barb.id)   // escopo: só thread dele
    .eq('autor', 'dono')          // barbeiro só lê mensagem do dono
    .is('lida_em', null)
  if (error) return { error: 'Erro ao confirmar.' }

  revalidatePath('/b/' + linkCodigo)
  return { ok: true }
}
