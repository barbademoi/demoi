import { createClient } from '@/utils/supabase/server'

// Validação compartilhada pelos 3 endpoints de mensagem:
// retorna { ok: true, ... } quando o user logado é dono do estabelecimento
// dono da mensagem. Caso contrário, retorna { ok: false, status, motivo }.
// Frontend e backend confiam só nessa função pra autorização.

export type Validacao =
  | { ok: true; userId: string; mensagemId: string; estabelecimentoId: string }
  | { ok: false; status: number; motivo: string }

export async function validarDono(mensagemId: string): Promise<Validacao> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, motivo: 'nao_autenticado' }

  // Resolve estabelecimento da mensagem e confere se o user é dono.
  // RLS já faria isso, mas validamos explicito pra dar mensagem útil
  // antes de tentar o UPDATE/DELETE.
  const { data: msg } = await supabase
    .from('mensagens_colaboradores')
    .select('id, estabelecimento_id, estabelecimentos!inner(dono_id)')
    .eq('id', mensagemId)
    .maybeSingle()

  if (!msg) return { ok: false, status: 404, motivo: 'mensagem_nao_encontrada' }

  type EstabRel = { dono_id: string } | { dono_id: string }[]
  const estabRel = (msg as unknown as { estabelecimentos: EstabRel }).estabelecimentos
  const dono = Array.isArray(estabRel) ? estabRel[0]?.dono_id : estabRel?.dono_id

  if (dono !== user.id) {
    return { ok: false, status: 403, motivo: 'sem_permissao' }
  }

  return {
    ok: true,
    userId: user.id,
    mensagemId: msg.id as string,
    estabelecimentoId: msg.estabelecimento_id as string,
  }
}
