export interface Cliente {
  /** chave única = telefone normalizado (só dígitos, com 55) */
  id: string
  nome: string
  telefone: string
  telefoneInvalido?: boolean
  ultimoCorte: string // YYYY-MM-DD
  contatadoEm: string | null // ISO datetime (America/Sao_Paulo) ou null
  criadoEm: string
  atualizadoEm: string
}

export interface Config {
  instrucaoBase: string
}

export interface LinhaImportada {
  linha: number
  nome: string
  telefoneOriginal: string
  dataOriginal: string
  erro?: string
}

export interface ResultadoUpload {
  totalLinhas: number
  novos: number
  atualizados: number
  ignorados: LinhaImportada[]
}
