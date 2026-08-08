import { createClient } from '@/lib/supabase/server'
import { avaliarAcesso, type Avaliacao } from './acesso'

/**
 * Lê a conta do usuário logado e avalia o acesso.
 *
 * Falha de leitura LIBERA (estado 'vitalicio'): se o banco oscilar, o certo é
 * deixar o cliente trabalhar, não trancar a barbearia inteira por um erro de
 * infra. A trava existe pra inadimplência, não pra instabilidade nossa.
 */
export async function verificarAssinatura(): Promise<Avaliacao & { userId: string | null }> {
  const liberado = {
    liberado: true as const, estado: 'vitalicio' as const, diasParaVencer: null,
    diasDeCarencia: null, validoAte: null, cancelada: false, atrasada: false,
  }
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...liberado, userId: null }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('usuarios')
      .select('tipo_acesso, status_assinatura, valido_ate')
      .eq('id', user.id)
      .maybeSingle()
    if (error || !data) return { ...liberado, userId: user.id }

    return { ...avaliarAcesso(data), userId: user.id }
  } catch (err) {
    // O Next sinaliza "esta rota é dinâmica" LANÇANDO um erro com este digest.
    // Engolir isso faria a página ser renderizada estaticamente com o acesso
    // congelado como liberado — ou seja, a trava nunca rodaria de verdade.
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') throw err
    console.error('[assinatura] falha ao verificar (liberando):', err)
    return { ...liberado, userId: null }
  }
}
