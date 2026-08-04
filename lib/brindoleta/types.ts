export type BrindoletaOfferType = 'Serviço' | 'Produto' | 'Brinde'
export type BrindoletaSaleStatus = 'pending' | 'confirmed' | 'rejected'

export type BrindoletaOffer = {
  id: string
  barbearia_id: string
  title: string
  benefit: string
  offer_type: BrindoletaOfferType
  chance: number
  stock: number
  revenue_cents: number
  color: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export type BrindoletaBarber = {
  id: string
  nome: string
  foto_url: string | null
  link_codigo: string
  tipo?: 'barbeiro' | 'recepcionista' | null
}

export type BrindoletaSpin = {
  id: string
  barbeiro_id: string
  offer_id: string | null
  created_at: string
}

export type BrindoletaSale = {
  id: string
  spin_id: string
  barbeiro_id: string
  offer_id: string | null
  customer_name: string
  offer_title: string
  benefit: string
  amount_cents: number
  status: BrindoletaSaleStatus
  created_at: string
  decided_at: string | null
}

export type PublicBrindoletaOffer = Pick<
  BrindoletaOffer,
  'id' | 'title' | 'offer_type' | 'color'
>

export type BrindoletaPrize = PublicBrindoletaOffer & {
  benefit: string
  revenue_cents: number
}
