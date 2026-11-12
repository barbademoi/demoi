// Tipos das tabelas do Tarefix (espelham supabase/migrations/001_estrutura.sql)

export type TomMensagens = 'zoeira' | 'neutro'

export type Empresa = {
  id: string
  nome: string
  logo_url: string | null
  horario_fechamento: string // 'HH:MM:SS'
  tom_mensagens: TomMensagens
  liberar_continuas_min: number // minutos antes do fechamento em que libera o check das tarefas do dia todo
  criado_em: string
}

export type Dono = { id: string; empresa_id: string; nome: string; email: string }

export type Funcao = {
  id: string
  empresa_id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criado_em: string
}

export type Colaborador = {
  id: string
  empresa_id: string
  funcao_id: string | null
  nome: string
  foto_url: string | null
  token_acesso: string
  pin_hash: string | null
  pin_tentativas: number
  pin_bloqueado_ate: string | null
  ativo: boolean
  criado_em: string
}

export type TarefaModelo = {
  id: string
  empresa_id: string
  colaborador_id: string
  titulo: string
  descricao: string | null
  dias_semana: number[]
  exige_foto: boolean
  ativo: boolean
  ordem: number
  horario_inicio: string | null // 'HH:MM:SS' — "começar às"
  continua: boolean // vale o dia todo (fica fixa no topo)
  peso: number // 1..3
  horario_limite: string | null // 'HH:MM:SS' — "fazer até"
  tempo_estimado_min: number | null
  criado_em: string
}

export type TarefaAvulsa = {
  id: string
  empresa_id: string
  colaborador_id: string
  titulo: string
  descricao: string | null
  data: string
  exige_foto: boolean
  horario_inicio: string | null
  horario_limite: string | null
  tempo_estimado_min: number | null
  continua: boolean
  peso: number
  criado_em: string
}

export type Folga = { id: string; empresa_id: string; colaborador_id: string; data: string }

export type StatusTarefa = 'pendente' | 'feita' | 'reprovada'

export type TarefaDia = {
  id: string
  empresa_id: string
  colaborador_id: string
  data: string
  origem: 'modelo' | 'avulsa'
  origem_id: string
  titulo: string
  descricao: string | null
  exige_foto: boolean
  ordem: number
  horario_inicio: string | null
  horario_limite: string | null
  tempo_estimado_min: number | null
  continua: boolean
  peso: number
  autoavaliacao: number | null // 1..5, só nas do dia todo
  observacao: string | null // escrita pelo colaborador (até 200)
  observacao_em: string | null
  status: StatusTarefa
  feita_em: string | null
  foto_path: string | null
  motivo_reprovacao: string | null
  reprovada_em: string | null
}

export type Extra = {
  id: string
  empresa_id: string
  colaborador_id: string
  data: string
  descricao: string
  foto_path: string | null
  status: 'pendente' | 'aprovada' | 'recusada'
  criado_em: string
}

export type NivelBonus = { percentual: number; premio: string }

export type BonusConfig = {
  id: string
  empresa_id: string
  ativo: boolean
  mostrar_para_colaborador: boolean
  niveis: NivelBonus[]
}

export type Aviso = {
  id: string
  empresa_id: string
  tipo: 'fechamento_dia' | 'extra_nova' | 'foto_enviada' | 'observacao' | 'geral'
  texto: string
  link: string | null
  chave: string | null
  lido: boolean
  criado_em: string
}

export type MesFechado = {
  id: string
  empresa_id: string
  colaborador_id: string
  ano_mes: string
  percentual_final: number
  extras_aprovadas: number
  bonus_atingido: NivelBonus | null
  fechado_em: string
}
