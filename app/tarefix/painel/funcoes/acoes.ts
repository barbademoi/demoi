'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'

export async function salvarFuncao(dados: { id?: string; nome: string; descricao: string; ativo: boolean }): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const nome = dados.nome.trim()
  if (!nome) return { ok: false, erro: 'Dê um nome para a função.' }
  const linha = { nome, descricao: dados.descricao.trim() || null, ativo: dados.ativo }
  const { error } = dados.id
    ? await s.db.from('funcoes').update(linha).eq('id', dados.id)
    : await s.db.from('funcoes').insert({ ...linha, empresa_id: s.empresa.id })
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

export async function excluirFuncao(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('funcoes').delete().eq('id', id)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}
