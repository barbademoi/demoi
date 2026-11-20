'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, mensagemErro, type Resultado } from '@/lib/tarefix/dono'
import { hashPin, novoToken, pinValido } from '@/lib/tarefix/pin'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

function revalidar(id?: string) {
  revalidatePath('/tarefix/painel', 'layout')
  if (id) revalidatePath(`/tarefix/painel/colaboradores/${id}`)
}

export async function criarColaborador(dados: {
  nome: string
  funcao_id: string | null
  pin: string
}): Promise<{ ok: true; id: string } | { ok: false; erro: string }> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const nome = dados.nome.trim()
  if (!nome) return { ok: false, erro: 'Informe o nome.' }
  if (!pinValido(dados.pin)) return { ok: false, erro: 'O PIN precisa ter 4 números.' }
  const { data, error } = await s.db
    .from('colaboradores')
    .insert({
      empresa_id: s.empresa.id,
      nome,
      funcao_id: dados.funcao_id || null,
      pin_hash: hashPin(dados.pin),
      token_acesso: novoToken(),
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, erro: mensagemErro(error) }
  revalidar()
  return { ok: true, id: data.id }
}

export async function salvarDadosColaborador(dados: {
  id: string
  nome: string
  funcao_id: string | null
  foto_url: string | null
}): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const nome = dados.nome.trim()
  if (!nome) return { ok: false, erro: 'Informe o nome.' }
  const { error } = await s.db
    .from('colaboradores')
    .update({ nome, funcao_id: dados.funcao_id || null, foto_url: dados.foto_url })
    .eq('id', dados.id)
    .eq('eh_dono', false)
  if (error) return falha(error)
  revalidar(dados.id)
  return { ok: true }
}

export async function trocarPin(id: string, pin: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!pinValido(pin)) return { ok: false, erro: 'O PIN precisa ter 4 números.' }
  // Trocar o PIN também derruba as sessões abertas (o cookie depende do hash).
  const { error } = await s.db
    .from('colaboradores')
    .update({ pin_hash: hashPin(pin), pin_tentativas: 0, pin_bloqueado_ate: null })
    .eq('id', id)
    .eq('eh_dono', false)
  if (error) return falha(error)
  revalidar(id)
  return { ok: true }
}

export async function gerarNovoLink(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('colaboradores').update({ token_acesso: novoToken() }).eq('id', id).eq('eh_dono', false)
  if (error) return falha(error)
  revalidar(id)
  return { ok: true }
}

export async function definirAtivo(id: string, ativo: boolean): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('colaboradores').update({ ativo }).eq('id', id).eq('eh_dono', false)
  if (error) return falha(error)
  revalidar(id)
  return { ok: true }
}

export async function alternarFolga(colaboradorId: string, data: string, marcar: boolean): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, erro: 'Data inválida.' }
  const { error } = marcar
    ? await s.db.from('folgas').upsert(
        { empresa_id: s.empresa.id, colaborador_id: colaboradorId, data },
        { onConflict: 'colaborador_id,data', ignoreDuplicates: true }
      )
    : await s.db.from('folgas').delete().eq('colaborador_id', colaboradorId).eq('data', data)
  if (error) return falha(error)
  revalidar(colaboradorId)
  return { ok: true }
}

/**
 * Exclui o colaborador de vez: tarefas, folgas, extras, histórico, fechamentos
 * e fotos dele somem (o banco apaga em cascata). Para só parar o link e manter
 * o histórico, use "Colaborador ativo" (desativar).
 */
export async function excluirColaborador(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  // RLS: só acha colaborador da própria empresa (e nunca o do Meu dia)
  const { data: c } = await s.db.from('colaboradores').select('id, empresa_id').eq('id', id).eq('eh_dono', false).maybeSingle()
  if (!c) return { ok: false, erro: 'Colaborador não encontrado.' }

  // fotos das tarefas e das extras (bucket privado): melhor esforço
  try {
    const st = createTarefixAdmin().storage.from('tarefix-provas')
    const raiz = `${c.empresa_id}/${c.id}`
    const { data: dias } = await st.list(raiz, { limit: 1000 })
    for (const d of dias ?? []) {
      const { data: arqs } = await st.list(`${raiz}/${d.name}`, { limit: 1000 })
      const caminhos = (arqs ?? []).map((a) => `${raiz}/${d.name}/${a.name}`)
      if (caminhos.length) await st.remove(caminhos)
    }
  } catch {
    /* fotos que sobrarem não aparecem em lugar nenhum */
  }

  const { error } = await s.db.from('colaboradores').delete().eq('id', id).eq('eh_dono', false)
  if (error) return falha(error)
  revalidar()
  return { ok: true }
}
