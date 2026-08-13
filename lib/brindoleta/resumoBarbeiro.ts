/**
 * CONFERÊNCIA DA BRINDOLETA DO BARBEIRO.
 *
 * Só repassa o que `brindoleta_resumo_barbeiro()` devolve (migration 052).
 * A função recebe o LINK_CODIGO e resolve o barbeiro sozinha — daqui não é
 * possível pedir o número de outro, porque não existe parâmetro pra isso.
 *
 * Nada é recalculado: os números são contagens das mesmas linhas que a
 * Brindoleta grava. Um total que discordasse do painel do dono faria o barbeiro
 * desconfiar dos dois.
 */

export interface ResumoBrindoletaBarbeiro {
  giros: number
  resgates: number
  confirmadas: number
  pendentes: number
  recusadas: number
  /** Só de vendas CONFIRMADAS pelo dono — pendente não é dinheiro ainda. */
  valorConfirmadoCents: number
  cicloInicio: string
  cicloFim: string
}

type ClienteComRpc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
}

export async function buscarResumoBrindoletaBarbeiro(
  client: ClienteComRpc,
  linkCodigo: string,
): Promise<ResumoBrindoletaBarbeiro | null> {
  if (!linkCodigo) return null

  const { data, error } = await client.rpc('brindoleta_resumo_barbeiro', {
    p_link_codigo: linkCodigo,
  })

  // Sem resumo a seção some. É melhor a aba não existir do que existir vazia
  // ou com número errado numa tela que serve pra conferir.
  if (error) {
    console.error('[brindoleta] resumo do barbeiro:', error)
    return null
  }

  const linha = Array.isArray(data) ? data[0] : data
  if (!linha) return null
  // A barbearia não usa Brindoleta: a seção nem aparece.
  if (linha.liberada !== true) return null

  return {
    giros: Number(linha.giros) || 0,
    resgates: Number(linha.resgates) || 0,
    confirmadas: Number(linha.confirmadas) || 0,
    pendentes: Number(linha.pendentes) || 0,
    recusadas: Number(linha.recusadas) || 0,
    valorConfirmadoCents: Number(linha.valor_confirmado_cents) || 0,
    cicloInicio: String(linha.ciclo_inicio ?? ''),
    cicloFim: String(linha.ciclo_fim ?? ''),
  }
}

/** Conversão de giros em resgates, em %. Sem giro, não existe taxa. */
export function taxaConversao(r: ResumoBrindoletaBarbeiro): number | null {
  if (r.giros <= 0) return null
  return (r.resgates / r.giros) * 100
}
