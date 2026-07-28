export interface ItemTextoAgendaPdf {
  str: string
  transform: number[]
}

export interface ProfissionalRelatorioAgenda {
  nomeRelatorio: string
  faturamentoAcumulado: number
  comissaoAcumulada: number
}

export interface LeituraRelatorioAgenda {
  periodoInicio: string
  periodoFim: string
  profissionais: ProfissionalRelatorioAgenda[]
  totais: {
    faturamentoAcumulado: number
    comissaoAcumulada: number
  }
}
