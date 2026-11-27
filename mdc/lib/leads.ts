import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Lead = {
  id: string
  created_at: string
  nome: string
  whatsapp: string
  cidade: string
  uf: string
  perfil: string
  disposicao: string
  autoriza_contato: boolean
  instagram: string | null
  num_barbeiros: number | null
  faturamento: string | null
  dor: string | null
  dor_outro: string | null
  origem: string | null
  utm: Record<string, string> | null
  status: string
  notas: string | null
}

export type FiltrosLead = {
  q?: string
  perfil?: string
  disposicao?: string
  faturamento?: string
  cidade?: string
  status?: string
}

/** Tira o que quebraria o filtro `or` do PostgREST. */
function limpar(v: string) {
  return v.replace(/[,()*%\\]/g, ' ').trim().slice(0, 80)
}

export function consultarLeads(supabase: SupabaseClient, f: FiltrosLead) {
  let q = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (f.perfil) q = q.eq('perfil', f.perfil)
  if (f.disposicao) q = q.eq('disposicao', f.disposicao)
  if (f.faturamento) q = q.eq('faturamento', f.faturamento)
  if (f.status) q = q.eq('status', f.status)
  if (f.cidade) q = q.ilike('cidade', `%${limpar(f.cidade)}%`)
  if (f.q) {
    const t = limpar(f.q)
    const dig = t.replace(/\D/g, '')
    const ors = [`nome.ilike.%${t}%`, `cidade.ilike.%${t}%`, `instagram.ilike.%${t}%`]
    if (dig.length >= 3) ors.push(`whatsapp.ilike.%${dig}%`)
    if (t) q = q.or(ors.join(','))
  }
  return q.limit(2000)
}
