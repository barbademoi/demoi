/**
 * DECISÃO DO POPUP DE OFERTA — feita no servidor, a cada carregamento.
 *
 * Devolve `null` quando o popup NÃO deve aparecer. Assim o componente sequer é
 * montado pra quem já tem a Brindoleta: a oferta não chega ao navegador, então
 * não há como ela vazar num inspetor pra quem já pagou pelo módulo.
 *
 * Quem responde "pode aparecer?" é o banco — mesma régua de acesso do módulo,
 * mais o adiamento de 7 dias e o "não tenho interesse".
 */

export interface PopupBrindoleta {
  precoLabel: string
  midiaUrl: string | null
  midiaTipo: 'gif' | 'video' | null
}

type Cliente = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (tabela: string) => any
}

export async function decidirPopupBrindoleta(
  client: Cliente,
  precoLabel: string,
): Promise<PopupBrindoleta | null> {
  const { data, error } = await client.rpc('brindoleta_popup_deve_aparecer')

  // Falha fechada: na dúvida, não interrompe ninguém com uma oferta. Um popup
  // a menos não custa nada; um popup indevido para quem já comprou, sim.
  if (error) {
    console.error('[brindoleta/popup] deve_aparecer:', error)
    return null
  }
  if (data !== true) return null

  // A mídia é opcional — sem ela o popup mostra o placeholder e segue de pé.
  let midiaUrl: string | null = null
  let midiaTipo: 'gif' | 'video' | null = null
  try {
    const { data: cfg } = await client
      .from('brindoleta_popup_config')
      .select('midia_url, midia_tipo')
      .maybeSingle()
    midiaUrl = (cfg?.midia_url as string) || null
    midiaTipo = (cfg?.midia_tipo as 'gif' | 'video') || null
  } catch {
    // segue com placeholder
  }

  return { precoLabel, midiaUrl, midiaTipo }
}
