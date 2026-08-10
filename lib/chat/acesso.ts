/**
 * QUEM ENTRA NO CHAT — assinante com assinatura ativa, e mais ninguém.
 *
 * A pergunta é respondida pela MESMA função SQL que as policies usam
 * (`assinatura_ativa()`, migration 049). Não existe régua paralela em
 * TypeScript: se a tela e o RLS discordassem, o assinante veria o menu e
 * tomaria erro ao abrir — ou pior, o contrário.
 *
 * Vitalício e não-assinante dão false aqui, e a assinatura que cai leva o
 * acesso junto sem nenhum job: a função é reavaliada a cada consulta.
 */

type ClienteComRpc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
}

export async function ehAssinanteAtivo(client: ClienteComRpc): Promise<boolean> {
  const { data, error } = await client.rpc('assinatura_ativa')
  // Falha fechada: sem confirmar a assinatura, não abre o chat.
  if (error) {
    console.error('[chat] assinatura_ativa:', error)
    return false
  }
  return data === true
}

/** Contexto da barbearia pra preencher os marcadores do comunicado. */
export async function buscarContextoChat(
  client: ClienteComRpc,
  barbeariaId: string,
): Promise<Record<string, unknown> | null> {
  if (!barbeariaId) return null
  const { data, error } = await client.rpc('chat_contexto_barbearia', {
    p_barbearia_id: barbeariaId,
  })
  // Sem contexto o comunicado ainda aparece — só cai nos textos neutros.
  // Esconder a mensagem por falta de número seria pior do que exibi-la.
  if (error) {
    console.error('[chat] chat_contexto_barbearia:', error)
    return null
  }
  return (data ?? null) as Record<string, unknown> | null
}
