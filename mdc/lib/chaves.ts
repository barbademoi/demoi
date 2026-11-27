// Toda chave de "settings" que o admin pode gravar, com a visibilidade dela.
// O servidor recusa qualquer chave fora desta lista.
export const CHAVES_CONFIG = {
  landing: 'public',
  grupo_espera_url: 'public',
  msg_lead: 'admin',
  vendas: 'public',
  termo: 'public',
  pagamento: 'auth',
  msgs_vencimento: 'admin',
} as const

export type ChaveConfig = keyof typeof CHAVES_CONFIG
