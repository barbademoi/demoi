import { createAdminClient } from '@/lib/supabase/admin'

/**
 * A conta é de cliente do BarberMeta (tem cadastro em public.usuarios)?
 * Para essas contas o Tarefix é módulo pago: nada de criar um grátis.
 * Na dúvida (erro ao consultar), trata como cliente: o pior caso é mandar
 * para a página de compra, nunca liberar de graça por engano.
 */
export async function ehClienteBarbermeta(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any).from('usuarios').select('id').eq('id', userId).maybeSingle()
  if (error) return true
  return Boolean(data)
}
