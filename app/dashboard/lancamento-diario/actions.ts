'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface LancamentoItem {
  barbeiro_id: string
  valor: number
}

export async function salvarLancamentosDiarios(
  lancamentos: LancamentoItem[],
  data: string,         // 'YYYY-MM-DD'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const agora = new Date().toISOString()
  const rows = lancamentos
    .filter(l => l.valor >= 0)
    .map(l => ({
      barbearia_id:  usuario.barbearia_id,
      barbeiro_id:   l.barbeiro_id,
      data,
      valor:         l.valor,
      atualizado_em: agora,
    }))

  if (rows.length === 0) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lancamentos_diarios')
    .upsert(rows, { onConflict: 'barbeiro_id,data' })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}
