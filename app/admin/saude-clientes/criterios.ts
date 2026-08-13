import type { ClienteSaude, StatusSaude } from './types'

/**
 * Régua inicial de Customer Success.
 *
 * Todos os limites ficam aqui de propósito: ajustes futuros não exigem mudar
 * a consulta, o banco ou o componente visual.
 */
export const CRITERIOS_SAUDE = {
  saudavelMaxDiasSemLogin: 7,
  saudavelMaxDiasSemLancamento: 7,
  saudavelMinDiasComAtividadeEm30: 8,
  riscoMinDiasSemLogin: 21,
  riscoMinDiasSemLancamento: 21,
  toleranciaNovoClienteDias: 10,
} as const

function diasDesdeCadastro(dataCadastro: string): number {
  const cadastro = new Date(dataCadastro).getTime()
  if (!Number.isFinite(cadastro)) return 0
  return Math.max(0, Math.floor((Date.now() - cadastro) / 86_400_000))
}

export function classificarSaude(cliente: ClienteSaude): StatusSaude {
  const riscoPorLogin = cliente.diasSemLogin >= CRITERIOS_SAUDE.riscoMinDiasSemLogin
  const riscoPorLancamento = cliente.diasSemLancamento >= CRITERIOS_SAUDE.riscoMinDiasSemLancamento

  if (riscoPorLogin || riscoPorLancamento) return 'risco'

  const loginRecente = !cliente.nuncaLogou
    && cliente.diasSemLogin <= CRITERIOS_SAUDE.saudavelMaxDiasSemLogin
  const lancamentoRecente = !cliente.nuncaLancou
    && cliente.diasSemLancamento <= CRITERIOS_SAUDE.saudavelMaxDiasSemLancamento
  const usoConstante = cliente.diasComAtividade30 >= CRITERIOS_SAUDE.saudavelMinDiasComAtividadeEm30

  return loginRecente && lancamentoRecente && usoConstante ? 'saudavel' : 'atencao'
}

export function motivosDaSaude(cliente: ClienteSaude): string[] {
  const motivos: string[] = []
  const idadeConta = diasDesdeCadastro(cliente.dataCadastro)

  if (cliente.nuncaLogou) motivos.push(`O dono ainda não realizou login (${cliente.diasSemLogin} dias desde o cadastro).`)
  else if (cliente.diasSemLogin >= CRITERIOS_SAUDE.riscoMinDiasSemLogin) motivos.push(`Sem login há ${cliente.diasSemLogin} dias.`)
  else if (cliente.diasSemLogin > CRITERIOS_SAUDE.saudavelMaxDiasSemLogin) motivos.push(`O último login foi há ${cliente.diasSemLogin} dias.`)

  if (cliente.nuncaLancou) motivos.push(`Ainda não houve lançamento diário (${cliente.diasSemLancamento} dias desde o cadastro).`)
  else if (cliente.diasSemLancamento >= CRITERIOS_SAUDE.riscoMinDiasSemLancamento) motivos.push(`Sem lançar faturamento há ${cliente.diasSemLancamento} dias.`)
  else if (cliente.diasSemLancamento > CRITERIOS_SAUDE.saudavelMaxDiasSemLancamento) motivos.push(`O último lançamento foi há ${cliente.diasSemLancamento} dias.`)

  if (cliente.diasComAtividade30 < CRITERIOS_SAUDE.saudavelMinDiasComAtividadeEm30) {
    motivos.push(`Atividade registrada em ${cliente.diasComAtividade30} dos últimos 30 dias.`)
  }

  if (idadeConta <= CRITERIOS_SAUDE.toleranciaNovoClienteDias && (cliente.nuncaLogou || cliente.nuncaLancou)) {
    motivos.push('Cliente novo dentro do período inicial de acompanhamento.')
  }

  if (motivos.length === 0) motivos.push('Login e lançamentos recentes, com utilização constante.')
  return motivos
}
