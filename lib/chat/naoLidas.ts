/**
 * Contador de não lidas do chat, pro badge do menu (client).
 *
 * Soma comunicados nunca abertos + respostas do admin ainda não lidas. As
 * consultas passam pelo RLS, então um assinante nunca conta mensagem alheia:
 * se a policy não devolve a linha, ela não entra no número.
 */
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function contarChatNaoLidas(): Promise<number> {
  try {
    const [comunicados, leituras, respostas] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('chat_comunicados').select('id', { count: 'exact', head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('chat_comunicado_leituras').select('comunicado_id', { count: 'exact', head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('chat_suporte').select('id', { count: 'exact', head: true })
        .eq('autor', 'admin').is('lido_em', null),
    ])

    const publicados = comunicados.count ?? 0
    const lidos = leituras.count ?? 0
    const novasRespostas = respostas.count ?? 0

    // Comunicados só contam pra cima: uma leitura órfã (comunicado apagado
    // depois de lido) não pode virar número negativo no badge.
    return Math.max(0, publicados - lidos) + novasRespostas
  } catch {
    return 0
  }
}
