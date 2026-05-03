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
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          logo_url?: string | null
          cor_principal?: string
          created_at?: string
        }
        Update: {
          nome?: string
          logo_url?: string | null
          cor_principal?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          barbearia_id: string
          nome: string
          foto_url?: string | null
          link_codigo: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          nome?: string
          foto_url?: string | null
          link_codigo?: string
          ativo?: boolean
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
          premio_coletivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barbearia_id: string
          mes: number
          ano: number
          meta_coletiva?: number
          premio_coletivo?: string | null
          created_at?: string
        }
        Update: {
          meta_coletiva?: number
          premio_coletivo?: string | null
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
