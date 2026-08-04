export type TipoValorImportado = 'faturamento' | 'comissao'
export type AcaoConflito = 'ignorar' | 'substituir' | 'somar'

export interface ArquivoLido {
  colunas: string[]
  linhas: Array<Array<string | number | boolean | Date | null>>
  totalLinhas: number
}

export interface MapeamentoColunas {
  barbeiro: number
  data: number
  valor: number
}

export interface LinhaAgregadaCliente {
  nomeArquivo: string
  data: string
  valor: number
  linhasOriginais: number
}

export interface LinhaMapeadaCliente extends LinhaAgregadaCliente {
  barbeiroId: string
}

export interface PedidoPreviewImportacao {
  arquivoNome: string
  arquivoHash: string
  tipoValor: TipoValorImportado
  linhasArquivo: number
  linhasValidas: number
  linhas: LinhaMapeadaCliente[]
}

export interface AvisosAgregacao {
  linhasVazias: number
  nomesVazios: number
  datasInvalidas: number
  valoresInvalidos: number
  valoresNegativos: number
  linhasValidas: number
}

export interface ResultadoAgregacao {
  linhas: LinhaAgregadaCliente[]
  nomesEncontrados: string[]
  avisos: AvisosAgregacao
}

export interface LinhaPreview {
  chave: string
  barbeiroId: string
  barbeiroNome: string
  nomeArquivo: string
  data: string
  valorImportado: number
  valorExistente: number
  conflito: boolean
  linhasOriginais: number
  acao: AcaoConflito
}

export interface ResumoPreview {
  linhasArquivo: number
  linhasValidas: number
  lancamentosAgregados: number
  lancamentosImportaveis: number
  conflitos: number
  foraDoPeriodo: number
  mesesFechados: number
  totalImportavel: number
  periodoInicio: string
  periodoFim: string
}

export interface PreviewImportacao {
  linhas: LinhaPreview[]
  resumo: ResumoPreview
  avisos: string[]
  tipoValor: TipoValorImportado
  arquivoNome: string
  arquivoHash: string
}

export interface PedidoConfirmacaoImportacao extends PedidoPreviewImportacao {
  acoes: Array<{ chave: string; acao: AcaoConflito }>
}

export interface ResultadoConfirmacao {
  ok: true
  loteId: string | null
  aplicados: number
  ignorados: number
  totalAplicado: number
  mensagemAuditoria: string
}
