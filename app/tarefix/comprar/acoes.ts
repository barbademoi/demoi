'use server'

import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { dentroDoLimite } from '@/lib/tarefix/cadastro'
import { registrarPedido, type DadosPedido } from '@/lib/tarefixModulo/vendas'

/** Página de vendas: a pessoa avisa que fez o Pix. Não libera nada sozinho. */
export async function enviarPedido(d: DadosPedido): Promise<{ ok: true } | { ok: false; erro: string }> {
  return registrarPedido(d, () => dentroDoLimite(createTarefixAdmin()))
}
