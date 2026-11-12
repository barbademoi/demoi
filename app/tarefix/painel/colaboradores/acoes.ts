'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, mensagemErro, type Resultado } from '@/lib/tarefix/dono'
import { hashPin, novoToken, pinValido } from '@/lib/tarefix/pin'

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
  if (error) return falha(error)
  revalidar(id)
  return { ok: true }
}

export async function gerarNovoLink(id: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('colaboradores').update({ token_acesso: novoToken() }).eq('id', id)
  if (error) return falha(error)
  revalidar(id)
  return { ok: true }
}

export async function definirAtivo(id: string, ativo: boolean): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const { error } = await s.db.from('colaboradores').update({ ativo }).eq('id', id)
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
