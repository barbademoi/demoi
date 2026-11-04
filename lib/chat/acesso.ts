/**
 * QUEM ENTRA NO CHAT — quem tem Plus, e mais ninguém.
 *
 * A pergunta é respondida pela MESMA função SQL que as policies usam
 * (`plus_ativo()`, migration 061). Não existe régua paralela em TypeScript: se
 * a tela e o RLS discordassem, a pessoa veria o menu e tomaria erro ao abrir —
 * ou pior, o contrário.
 *
 * `plus_ativo()` é assinatura ativa OU Plus concedido à mão pelo admin. Antes
 * daqui ia `assinatura_ativa()` direto, e era por isso que uma conta de
 * cortesia (sempre vitalícia) nunca via o chat, nem com a liberação manual.
 *
 * Quem não tem nenhuma das duas portas dá false, e a assinatura que cai leva o
 * acesso junto sem nenhum job: a função é reavaliada a cada consulta.
 */

type ClienteComRpc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
}

export async function ehAssinanteAtivo(client: ClienteComRpc): Promise<boolean> {
  const { data, error } = await client.rpc('plus_ativo')
  if (!error) return data === true

  // PLANO B enquanto a migration 061 não rodar: `plus_ativo` não existe no
  // banco ainda, e deixar o erro passar esconderia o chat de quem PAGA. Cai
  // na pergunta antiga, que é um subconjunto da nova.
  const antiga = await client.rpc('assinatura_ativa')
  if (!antiga.error) return antiga.data === true

  // Falha fechada: sem conseguir confirmar o acesso, não abre o chat.
  console.error('[chat] plus_ativo e assinatura_ativa falharam:', error)
  return false
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
