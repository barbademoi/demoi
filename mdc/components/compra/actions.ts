'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { buscarMembro } from '@/lib/membro'
import { planoValido } from '@/lib/planos'

const EXT_OK = /\.(jpe?g|png|webp|heic|heif|pdf)$/i

/** Depois do upload direto pro storage: registra o pagamento "enviado". */
export async function registrarComprovante(path: string, planoEscolhido?: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase, user, membro } = await buscarMembro()
  if (!user || !membro) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  if (!path.startsWith(`${user.id}/`) || path.includes('..') || !EXT_OK.test(path)) return { ok: false, erro: 'Arquivo inválido.' }
  if (membro.status === 'cancelado') return { ok: false, erro: 'Sua conta está cancelada. Fala com a gente no WhatsApp.' }

  const plano = planoValido(planoEscolhido) ? planoEscolhido : membro.plano
  const { error } = await supabase.from('payments').insert({ member_id: user.id, plano, comprovante_path: path, status: 'enviado' })
  if (error) return { ok: false, erro: 'Não deu pra registrar o comprovante. Tenta de novo.' }

  if (membro.status === 'pendente') {
    await createAdminClient().from('members').update({ status: 'aguardando', plano }).eq('id', user.id).eq('status', 'pendente')
  }
  revalidatePath('/aguardando')
  return { ok: true }
}

/** Troca de plano antes de pagar. */
export async function trocarPlano(plano: string): Promise<void> {
  const { user, membro } = await buscarMembro()
  if (!user || !membro || !planoValido(plano)) return
  if (membro.status !== 'pendente' && membro.status !== 'aguardando') return
  await createAdminClient().from('members').update({ plano }).eq('id', user.id)
  revalidatePath('/comprar/pagamento')
}
