import 'server-only'

import type { MapeamentoConfirmadoAgenda } from './types'

export function lerMapeamentosAgenda(
  formData: FormData,
): MapeamentoConfirmadoAgenda[] {
  const bruto = formData.get('mapeamentos')
  if (typeof bruto !== 'string' || bruto.length > 20_000) {
    throw new Error('O de-para dos barbeiros é inválido.')
  }

  let itens: unknown
  try {
    itens = JSON.parse(bruto)
  } catch {
    throw new Error('O de-para dos barbeiros é inválido.')
  }
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 100) {
    throw new Error('O de-para dos barbeiros é inválido.')
  }

  return itens.map(item => {
    if (
      !item ||
      typeof item !== 'object' ||
      !('nomeRelatorio' in item) ||
      !('barbeiroId' in item) ||
      typeof item.nomeRelatorio !== 'string' ||
      typeof item.barbeiroId !== 'string'
    ) {
      throw new Error('O de-para dos barbeiros é inválido.')
    }
    return {
      nomeRelatorio: item.nomeRelatorio.slice(0, 200).trim(),
      barbeiroId: item.barbeiroId.trim(),
    }
  })
}
