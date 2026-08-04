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

export interface BarbeiroDisponivelAgenda {
  id: string
  nome: string
}

export interface MapeamentoSalvoAgenda {
  nomeRelatorioChave: string
  barbeiroId: string
}

export interface MapeamentoConfirmadoAgenda {
  nomeRelatorio: string
  barbeiroId: string
}

export interface LinhaPreviewAgenda extends ProfissionalRelatorioAgenda {
  barbeiroId: string
  barbeiroNome: string
  faturamentoAnterior: number
  comissaoAnterior: number
  movimentoFaturamento: number
  movimentoComissao: number
  reimportacao: boolean
  proximaDataRecalculada: string | null
}

export interface PreviewConfirmacaoAgenda {
  leitura: LeituraRelatorioAgenda
  linhas: LinhaPreviewAgenda[]
  modoMeta: 'faturamento' | 'comissao' | 'ambos'
  baseMeta: 'faturamento' | 'comissao'
  reimportacao: boolean
  cicloFechado: boolean
  totaisMovimento: {
    faturamento: number
    comissao: number
  }
  avisos: string[]
  arquivoHash: string
}

export interface ResultadoConfirmacaoAgenda {
  ok: true
  loteId: string
  dataRelatorio: string
  reimportacao: boolean
  profissionais: number
  movimentoFaturamento: number
  movimentoComissao: number
  baseMeta: 'faturamento' | 'comissao'
  fotosRecalculadas: number
}
