'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'

// Tabelas editadas pelo admin, com os campos permitidos e o tipo de cada um.
type TipoCampo = 'texto' | 'int' | 'bool' | 'data' | 'uuid'
const TABELAS: Record<string, Record<string, TipoCampo>> = {
  testimonials: { nome: 'texto', local: 'texto', texto: 'texto', foto_url: 'texto', ordem: 'int', ativo: 'bool' },
  faqs: { pergunta: 'texto', resposta: 'texto', ordem: 'int', ativo: 'bool' },
  meetings: { nivel: 'int', semana: 'int', data: 'data', tema: 'texto', pdf_path: 'texto', youtube_url: 'texto', is_ultimo: 'bool' },
  kit_materials: { nivel: 'int', semana: 'int', titulo: 'texto', descricao: 'texto', file_path: 'texto', ordem: 'int' },
  mission_templates: {
    perfil: 'texto',
    semana: 'int',
    tipo: 'texto',
    titulo: 'texto',
    descricao: 'texto',
    kit_material_id: 'uuid',
    ordem: 'int',
    ativo: 'bool',
  },
}
const ARQUIVO: Record<string, string> = { meetings: 'pdf_path', kit_materials: 'file_path' }
const CAMINHOS = ['/admin/vendas', '/mdc', '/admin/conteudo', '/app']

function limpar(tabela: string, dados: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [k, tipo] of Object.entries(TABELAS[tabela])) {
    if (!(k in dados)) continue
    const v = dados[k]
    const s = typeof v === 'string' ? v.trim() : v
    if (tipo === 'int') out[k] = Number(s) || 0
    else if (tipo === 'bool') out[k] = v === true || v === 'on' || v === 'true'
    else if (tipo === 'data') out[k] = typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    else if (tipo === 'uuid') out[k] = typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s) ? s : null
    else out[k] = typeof s === 'string' ? s.slice(0, 5000) || null : null
  }
  return out
}

export async function salvarItem(tabela: string, id: string | null, dados: Record<string, unknown>) {
  const { supabase } = await assertAdmin()
  if (!(tabela in TABELAS)) throw new Error('Tabela inválida')
  const linha = limpar(tabela, dados)
  // Só um "último encontro" por vez.
  if (tabela === 'meetings' && linha.is_ultimo) {
    await supabase.from('meetings').update({ is_ultimo: false }).eq('is_ultimo', true)
  }
  const { error } = id ? await supabase.from(tabela).update(linha).eq('id', id) : await supabase.from(tabela).insert(linha)
  if (error) throw new Error(error.message)
  CAMINHOS.forEach((c) => revalidatePath(c, 'layout'))
}

export async function excluirItem(tabela: string, id: string) {
  const { supabase } = await assertAdmin()
  if (!(tabela in TABELAS)) throw new Error('Tabela inválida')
  const col = ARQUIVO[tabela]
  if (col) {
    const { data } = await supabase.from(tabela).select(col).eq('id', id).maybeSingle()
    const path = (data as Record<string, string> | null)?.[col]
    if (path) await supabase.storage.from('conteudo').remove([path])
  }
  const { error } = await supabase.from(tabela).delete().eq('id', id)
  if (error) throw new Error(error.message)
  CAMINHOS.forEach((c) => revalidatePath(c, 'layout'))
}
