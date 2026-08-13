export type StatusSaude = 'saudavel' | 'atencao' | 'risco'

export type ClienteSaude = {
  barbeariaId: string
  nome: string
  cidade: string | null
  dataCadastro: string
  emailDono: string | null
  telefone: string | null
  plano: string
  tipoAcesso: string | null
  periodicidade: string | null
  statusAssinatura: string | null
  ultimoLogin: string | null
  nuncaLogou: boolean
  diasSemLogin: number
  ultimoLancamentoDiario: string | null
  nuncaLancou: boolean
  diasSemLancamento: number
  quantidadeBarbeiros: number
  barbeirosComAtividadeMes: number
  diasComAtividade30: number
  statusSaude: StatusSaude
}
