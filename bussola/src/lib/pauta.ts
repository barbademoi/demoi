export type DecisaoFeedback = 'incluir' | 'particular' | 'ignorar'
export type AvaliacaoMeta = 'cumprida' | 'parcial' | 'nao_cumprida'

export interface NovaMeta {
  texto: string
  responsavel_id: string | null
}

// Estado da preparação/condução da reunião, salvo em reunioes.pauta (jsonb).
export interface PautaReuniao {
  iniciada_em?: string | null
  decisoes?: Record<string, DecisaoFeedback> // feedbackId -> decisão (legacy)
  metricasNotas?: string
  metasPassadas?: Record<string, { avaliacao: AvaliacaoMeta; comentario?: string }>
  novasMetas?: NovaMeta[]
  presentes?: string[]
  anotacoes?: Record<string, string> // feedbackId -> nota durante a condução
  anotacaoGeral?: string
  metricasDiscutida?: boolean
  // AJUSTE F — Modo Reunião com 6 momentos.
  momentoAtual?: number // 1..6
  aberturaChecks?: string[] // ids de itens do checklist de abertura concluídos
  notaEquipe?: string
}

export interface Reuniao {
  id: string
  estabelecimento_id: string
  data_reuniao: string
  duracao_minutos: number | null
  pauta: PautaReuniao | null
  anotacoes: string | null
  metas: unknown | null
  status: string
  created_at: string
}

export interface MetaSemanal {
  id: string
  estabelecimento_id: string
  reuniao_id: string | null
  texto: string
  responsavel_id: string | null
  semana_referencia: string
  status: string
  created_at: string
}
