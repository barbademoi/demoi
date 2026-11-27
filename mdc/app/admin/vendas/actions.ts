'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'

// Tabelas simples editadas pelo admin, com os campos permitidos de cada uma.
const TABELAS = {
  testimonials: ['nome', 'local', 'texto', 'foto_url', 'ordem', 'ativo'],
  faqs: ['pergunta', 'resposta', 'ordem', 'ativo'],
} as const
type Tabela = keyof typeof TABELAS

function limpar(tabela: Tabela, dados: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of TABELAS[tabela]) {
    if (!(k in dados)) continue
    const v = dados[k]
    if (k === 'ordem') out[k] = Number(v) || 0
    else if (k === 'ativo') out[k] = v === true || v === 'on' || v === 'true'
    else out[k] = typeof v === 'string' ? v.trim().slice(0, 5000) || null : null
  }
  return out
}

export async function salvarItem(tabela: string, id: string | null, dados: Record<string, unknown>) {
  const { supabase } = await assertAdmin()
  if (!(tabela in TABELAS)) throw new Error('Tabela inválida')
  const t = tabela as Tabela
  const linha = limpar(t, dados)
  const { error } = id ? await supabase.from(t).update(linha).eq('id', id) : await supabase.from(t).insert(linha)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/vendas')
  revalidatePath('/mdc')
}

export async function excluirItem(tabela: string, id: string) {
  const { supabase } = await assertAdmin()
  if (!(tabela in TABELAS)) throw new Error('Tabela inválida')
  const { error } = await supabase.from(tabela as Tabela).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/vendas')
  revalidatePath('/mdc')
}
