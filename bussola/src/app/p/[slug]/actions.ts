'use server'

import { createAdminClient } from '@/utils/supabase/admin'

interface EnviarMensagemInput {
  slug: string
  conteudo: string
  anonimo: boolean
}

interface Resultado {
  ok: boolean
  erro?: string
}

// Envia mensagem do colaborador pro dono do estabelecimento. Quando
// anonimo=true, colaborador_id é gravado como NULL — não há rastro de
// quem enviou. IP NUNCA é gravado.
export async function enviarMensagemColaborador(
  input: EnviarMensagemInput,
): Promise<Resultado> {
  const conteudo = input.conteudo.trim()
  if (conteudo.length < 20) {
    return { ok: false, erro: 'Mensagem muito curta (mínimo 20 caracteres).' }
  }
  if (conteudo.length > 2000) {
    return { ok: false, erro: 'Mensagem muito longa (máximo 2000 caracteres).' }
  }

  const admin = createAdminClient()

  const { data: prof } = await admin
    .from('profissionais')
    .select('id, estabelecimento_id, status')
    .eq('slug', input.slug)
    .maybeSingle()

  if (!prof || prof.status === 'desligado') {
    return { ok: false, erro: 'Link inválido.' }
  }

  const { error } = await admin.from('mensagens_colaboradores').insert({
    estabelecimento_id: prof.estabelecimento_id,
    colaborador_id: input.anonimo ? null : prof.id,
    conteudo,
    anonimo: input.anonimo,
  })

  if (error) {
    return { ok: false, erro: 'Falha ao enviar. Tenta de novo.' }
  }

  return { ok: true }
}

// Dono marca mensagem como lida.
export async function marcarMensagemComoLida(id: string): Promise<Resultado> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('mensagens_colaboradores')
    .update({ lida: true })
    .eq('id', id)
  if (error) return { ok: false, erro: 'Falha ao marcar como lida.' }
  return { ok: true }
}
