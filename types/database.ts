export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      barbearias: {
        Row: {
          id: string
          nome: string
          logo_url: string | null
          cor_principal: string
          mostrar_ticket_medio: boolean
          mostrar_faturamento_geral: boolean
          dias_trabalho_padrao: number | null
          comportamento_ativo: boolean
          evolucao_faturamento_minimo: number
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          logo_url?: string | null
          cor_principal?: string
          mostrar_ticket_medio?: boolean
          mostrar_faturamento_geral?: boolean
          dias_trabalho_padrao?: number | null
          comportamento_ativo?: boolean
          evolucao_faturamento_minimo?: number
          created_at?: string
        }
        Update: {
          nome?: string
          logo_url?: string | null
          cor_principal?: string
          mostrar_ticket_medio?: boolean
          mostrar_faturamento_geral?: boolean
          dias_trabalho_padrao?: number | null
          comportamento_ativo?: boolean
          evolucao_faturamento_minimo?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          barbearia_id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          barbearia_id: string
          email: string
          created_at?: string
        }
        Update: {
          barbearia_id?: string
          email?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usuarios_barbearia_id_fkey'
            columns: ['barbearia_id']
            referencedRelation: 'barbearias'
            referencedColumns: ['id']
          }
        ]
      }
      barbeiros: {
        Row: {
          id: string
          barbearia_id: string
          nome: string
          foto_url: string | null
          link_codigo: string
          ativo: boolean
          tipo: 'barbeiro' | 'recepcionista'
          dias_trabalho_mes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          barbearia_id: string
          nome: string
          foto_url?: string | null
          link_codigo: string
          ativo?: boolean
          tipo?: 'barbeiro' | 'recepcionista'
          dias_trabalho_mes?: number | null
          created_at?: string
        }
        Update: {
          nome?: string
          foto_url?: string | null
          link_codigo?: string
          ativo?: boolean
          tipo?: 'barbeiro' | 'recepcionista'
          dias_trabalho_mes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'barbeiros_barbearia_id_fkey'
            columns: ['barbearia_id']
            referencedRelation: 'barbearias'
            referencedColumns: ['id']
          }
        ]
      }
      metas: {
        Row: {
          id: string
          barbearia_id: string
          mes: number
          ano: number
          meta_coletiva: number
          meta_coletiva_bronze: number
          meta_coletiva_prata: number
          premio_coletivo: string | null
          premio_coletivo_bronze: string | null
          premio_coletivo_prata: string | null
          faturamento_acumulado: number
          created_at: string
        }
        Insert: {
          id?: string
          barbearia_id: string
          mes: number
          ano: number
          meta_coletiva?: number
          meta_coletiva_bronze?: number
          meta_coletiva_prata?: number
          premio_coletivo?: string | null
          premio_coletivo_bronze?: string | null
          premio_coletivo_prata?: string | null
          faturamento_acumulado?: number
          created_at?: string
        }
        Update: {
          meta_coletiva?: number
          meta_coletiva_bronze?: number
          meta_coletiva_prata?: number
          premio_coletivo?: string | null
          premio_coletivo_bronze?: string | null
          premio_coletivo_prata?: string | null
          faturamento_acumulado?: number
        }
        Relationships: [
          {
            foreignKeyName: 'metas_barbearia_id_fkey'
            columns: ['barbearia_id']
            referencedRelation: 'barbearias'
            referencedColumns: ['id']
          }
        ]
      }
      metas_individuais: {
        Row: {
          id: string
          meta_id: string
          barbeiro_id: string
          bronze_comm: number
          bronze_premio: string | null
          prata_comm: number
          prata_premio: string | null
          ouro_comm: number
          ouro_premio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meta_id: string
          barbeiro_id: string
          bronze_comm?: number
          bronze_premio?: string | null
          prata_comm?: number
          prata_premio?: string | null
          ouro_comm?: number
          ouro_premio?: string | null
          created_at?: string
        }
        Update: {
          bronze_comm?: number
          bronze_premio?: string | null
          prata_comm?: number
          prata_premio?: string | null
          ouro_comm?: number
          ouro_premio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'metas_individuais_meta_id_fkey'
            columns: ['meta_id']
            referencedRelation: 'metas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'metas_individuais_barbeiro_id_fkey'
            columns: ['barbeiro_id']
            referencedRelation: 'barbeiros'
            referencedColumns: ['id']
          }
        ]
      }
      lancamentos: {
        Row: {
          id: string
          barbearia_id: string
          barbeiro_id: string
          mes: number
          ano: number
          comissao_acumulada: number
          modo: 'direto' | 'calculado'
          faturamento: number | null
          perc_assinatura: number | null
          perc_servico: number | null
          perc_produto: number | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          barbearia_id: string
          barbeiro_id: string
          mes: number
          ano: number
          comissao_acumulada?: number
          modo?: 'direto' | 'calculado'
          faturamento?: number | null
          perc_assinatura?: number | null
          perc_servico?: number | null
          perc_produto?: number | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          comissao_acumulada?: number
          modo?: 'direto' | 'calculado'
          faturamento?: number | null
          perc_assinatura?: number | null
          perc_servico?: number | null
          perc_produto?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lancamentos_barbearia_id_fkey'
            columns: ['barbearia_id']
            referencedRelation: 'barbearias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lancamentos_barbeiro_id_fkey'
            columns: ['barbeiro_id']
            referencedRelation: 'barbeiros'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_barbearia_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Tipos derivados convenientes
export type Barbearia = Database['public']['Tables']['barbearias']['Row']
export type Barbeiro = Database['public']['Tables']['barbeiros']['Row']
export type Meta = Database['public']['Tables']['metas']['Row']
export type MetaIndividual = Database['public']['Tables']['metas_individuais']['Row']
export type Lancamento = Database['public']['Tables']['lancamentos']['Row']

export type Tier = 'bronze' | 'prata' | 'ouro'
export type ModoPontos = 'metas' | 'pontos' | 'ambos'

// ── Comportamento (conduta) — trilha PRIVADA do dono ───
// Isolada das vendas: não entra em pontuação, meta, projetado nem ranking.

export interface RegraConduta {
  id: string
  barbearia_id: string
  nome: string
  valor: number      // com sinal: +10 reforço, -20 penalidade
  ativo: boolean
  created_at: string
}

export interface OcorrenciaConduta {
  id: string
  barbearia_id: string
  barbeiro_id: string
  regra_id: string | null   // null = ajuste avulso (usa descricao)
  descricao: string | null
  valor: number             // snapshot aplicado no registro
  observacao: string | null // texto do dono exibido ao barbeiro
  data: string              // 'YYYY-MM-DD' (BRT)
  ciente_em: string | null  // timestamp da ciência do barbeiro; null = não visto
  created_at: string
}

export interface MensagemConduta {
  id: string
  barbearia_id: string
  barbeiro_id: string       // autor (se autor='barbeiro') ou destinatário (se 'dono')
  thread_id: string
  autor: 'barbeiro' | 'dono'
  anonima: boolean          // só vale pra autor='barbeiro'
  corpo: string
  lida_em: string | null    // quando o destinatário leu; null = não lida
  created_at: string
}

// ── Gamificação ────────────────────────────────────────

export interface ModoMes {
  id: string
  barbearia_id: string
  mes: number
  ano: number
  modo: ModoPontos
  created_at: string
}

export interface Campanha {
  id: string
  barbearia_id: string
  mes: number
  ano: number
  min_pontos: number
  min_pontos_recep: number
  bonus_assin_qtd: number
  bonus_assin_valor: number
  ativo: boolean
  regras_personalizadas: string | null
  quem_lanca: 'barbeiro' | 'dono'
  created_at: string
}

export interface CampanhaServico {
  id: string
  campanha_id: string
  emoji: string
  nome: string
  pontos: number
  conta_como_assinatura: boolean
  eh_servico_feedback: boolean
  created_at: string
}

export interface Brinde {
  id: string
  barbearia_id: string
  nome: string
  descricao: string | null
  foto_url: string | null
  peso: number
  ativo: boolean
  created_at: string
}

export interface FeedbackCliente {
  id: string
  barbearia_id: string
  barbeiro_id: string | null
  estrelas: number
  comentario: string | null
  nome_cliente: string | null
  contato_cliente: string | null
  brinde_id: string | null
  codigo_resgate: string | null
  brinde_usado: boolean
  brinde_atribuido_em: string | null
  foi_redirecionado_google: boolean
  pontos_concedidos: number
  lido: boolean
  arquivado: boolean
  data: string
  created_at: string
}

export interface BarbeariaFeedbackConfig {
  feedback_ativo: boolean
  feedback_slug: string | null
  feedback_mensagem_pos: string | null
  feedback_google_review_url: string | null
  feedback_nota_minima_positivo: number
  feedback_gamificacao_ativa: boolean
  feedback_pontos_por_feedback: number
  feedback_limite_diario_pontuavel: number
  feedback_brinde_minimo_id: string | null
}

export interface CampanhaPremio {
  id: string
  campanha_id: string
  posicao: number
  valor: number
  created_at: string
}

export interface ControleDiario {
  id: string
  barbeiro_id: string
  campanha_id: string
  data: string
  servico_id: string
  quantidade: number
  lancado_por: 'dono' | 'barbeiro'
  editado_por: 'dono' | 'barbeiro' | null
  editado_em: string | null
  created_at: string
}

export interface CampanhaComDetalhes extends Campanha {
  campanha_servicos: CampanhaServico[]
  campanha_premios: CampanhaPremio[]
}

export interface LancamentoDiario {
  id: string
  barbearia_id: string
  barbeiro_id: string
  data: string          // 'YYYY-MM-DD'
  valor: number
  faturamento_geral: number
  criado_em: string
  atualizado_em: string
}

export interface BarbeiroComMeta extends Barbeiro {
  meta?: MetaIndividual
  lancamento?: Lancamento
  progresso?: {
    bronze: number
    prata: number
    ouro: number
    tier_atual: Tier | null
  }
}
