/**
 * QUEM PODE USAR A BRINDOLETA — uma pergunta, um lugar.
 *
 * A Brindoleta abre por DOIS caminhos independentes: a licença avulsa da
 * barbearia (Pix conferido na mão) ou uma assinatura ativa do BarberMeta.
 * Quem tem qualquer um dos dois entra.
 *
 * A decisão mora no SQL (`brindoleta_liberada`, migration 049) e não aqui: a
 * roleta pública, o painel do dono, as páginas de QR Code e as actions fazem a
 * mesma pergunta, e replicar o `or` em seis arquivos é como as regras
 * começam a divergir. Aqui é só a chamada.
 *
 * Serve tanto pro client do usuário logado quanto pro admin (service_role) —
 * a função recebe a barbearia como argumento justamente porque a roleta
 * pública não tem sessão pra deduzir nada.
 */

/**
 * Client do Supabase — server ou admin; só precisa saber chamar `rpc`.
 *
 * `PromiseLike` e não `Promise`: o `rpc()` devolve um builder encadeável que
 * só vira promise quando aguardado, e exigir `Promise` aqui não casaria com
 * nenhum dos clients.
 */
type ClienteComRpc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
}

export async function brindoletaLiberada(
  client: ClienteComRpc,
  barbeariaId: string,
): Promise<boolean> {
  if (!barbeariaId) return false

  const { data, error } = await client.rpc('brindoleta_liberada', {
    p_barbearia_id: barbeariaId,
  })

  // Falha fechada, de propósito: se não deu pra confirmar o acesso, o pior
  // resultado é a tela de venda aparecer pra quem já pagou — recarregar
  // resolve. O contrário (abrir a central por causa de um erro de rede)
  // seria uma falha silenciosa de cobrança.
  if (error) {
    console.error('[brindoleta] brindoleta_liberada:', error)
    return false
  }
  return data === true
}
