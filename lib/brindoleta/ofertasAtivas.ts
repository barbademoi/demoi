/**
 * QUAIS OFERTAS ENTRAM NA ROLETA — uma pergunta, um lugar.
 *
 * A roda comporta no máximo 6 fatias, então em algum momento é preciso cortar.
 * O corte era pelas 6 MAIS ANTIGAS (`order created_at asc` + `limit 6`), o que
 * significa que, se por qualquer motivo existirem mais de 6 ofertas ativas, as
 * novas ficam invisíveis PARA SEMPRE — o dono edita, salva, e a roleta segue
 * com as antigas sem nenhum sinal de que algo foi cortado.
 *
 * Agora o corte é pelas 6 MAIS RECENTES e a exibição volta à ordem de criação.
 * Assim a roda mantém a mesma aparência de sempre para quem não mexeu em nada,
 * mas uma oferta recém-criada nunca pode ser a invisível.
 *
 * Este módulo é a fonte única: a página aberta pelo QR e o sorteio leem daqui.
 * Duas cópias da mesma query são exatamente como a roda e o prêmio passam a
 * discordar depois de um refactor.
 */

export const MAX_FATIAS = 6

export interface OfertaAtiva {
  id: string
  title: string
  benefit: string
  offer_type: string
  color: string
  revenue_cents: number
  chance: number
  created_at: string
}

type ClienteComFrom = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (tabela: string) => any
}

/**
 * Ofertas que o cliente final pode ganhar: ativas e com estoque.
 *
 * `stock > 0` não é detalhe: sem estoque a oferta não pode ser entregue, e
 * sortear algo que a barbearia não tem é pior do que não ofertar.
 */
export async function buscarOfertasAtivas(
  client: ClienteComFrom,
  barbeariaId: string,
): Promise<OfertaAtiva[]> {
  if (!barbeariaId) return []

  const { data, error } = await client
    .from('brindoleta_offers')
    .select('id, title, benefit, offer_type, color, revenue_cents, chance, created_at')
    .eq('barbearia_id', barbeariaId)
    .eq('enabled', true)
    .gt('stock', 0)
    // Corta pelas mais RECENTES…
    .order('created_at', { ascending: false })
    .limit(MAX_FATIAS)

  if (error) {
    console.error('[brindoleta] erro ao buscar ofertas ativas:', error)
    return []
  }

  // …e exibe na ordem de criação, que é a ordem que o dono já conhece.
  return ((data ?? []) as OfertaAtiva[])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

/** Só o que o cliente final pode ver — chance e valor nunca vão pro navegador. */
export function paraPublico(ofertas: OfertaAtiva[]) {
  return ofertas.map(({ id, title, offer_type, color }) => ({ id, title, offer_type, color }))
}
