'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { gerarSlug } from '@/lib/slug'
import {
  COMPETENCIAS,
  ESTILOS_COMUNICACAO,
  MOTIVADORES,
  MAX_MOTIVADORES,
  type StatusProfissional,
} from '@/lib/profissionais'

async function getEstabelecimentoId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  return data?.id ?? null
}

function parseMotivadores(raw: string | null): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((m): m is string => typeof m === 'string' && MOTIVADORES.includes(m))
      .slice(0, MAX_MOTIVADORES)
  } catch {
    return []
  }
}

function camposDoForm(formData: FormData) {
  const estilo = formData.get('estilo_comunicacao') as string | null
  return {
    nome: ((formData.get('nome') as string) ?? '').trim(),
    telefone: ((formData.get('telefone') as string) ?? '').trim() || null,
    funcao: ((formData.get('funcao') as string) ?? '').trim() || null,
    data_entrada: ((formData.get('data_entrada') as string) ?? '').trim() || null,
    foto_url: ((formData.get('foto_url') as string) ?? '').trim() || null,
    motivadores: parseMotivadores(formData.get('motivadores') as string | null),
    estilo_comunicacao: estilo && ESTILOS_COMUNICACAO.includes(estilo) ? estilo : null,
    pontos_fortes: ((formData.get('pontos_fortes') as string) ?? '').trim() || null,
    pontos_desenvolvimento: ((formData.get('pontos_desenvolvimento') as string) ?? '').trim() || null,
    notas_livres: ((formData.get('notas_livres') as string) ?? '').trim() || null,
  }
}

export async function criarProfissional(formData: FormData) {
  const campos = camposDoForm(formData)
  if (!campos.nome) return { error: 'O nome é obrigatório.' }

  let novoId: string | null = null

  try {
    const supabase = createClient()
    const estabelecimentoId = await getEstabelecimentoId()
    if (!estabelecimentoId) return { error: 'Sessão expirada. Faça login novamente.' }

    // Tenta inserir com slug aleatório; em caso de colisão (23505), gera outro.
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { data, error } = await supabase
        .from('profissionais')
        .insert({ estabelecimento_id: estabelecimentoId, slug: gerarSlug(), ...campos })
        .select('id')
        .single()

      if (!error && data) {
        novoId = data.id
        break
      }
      if (error && error.code !== '23505') {
        console.error('[criarProfissional] erro do supabase:', error)
        return { error: 'Não foi possível salvar. Tente novamente.' }
      }
    }

    if (!novoId) return { error: 'Não foi possível gerar o link. Tente novamente.' }

    revalidatePath('/painel/profissionais')
  } catch (err) {
    console.error('[criarProfissional] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect(`/painel/profissionais/${novoId}?novo=1`)
}

export async function atualizarProfissional(id: string, formData: FormData) {
  const campos = camposDoForm(formData)
  if (!campos.nome) return { error: 'O nome é obrigatório.' }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('profissionais').update(campos).eq('id', id)
    if (error) {
      console.error('[atualizarProfissional] erro do supabase:', error)
      return { error: 'Não foi possível salvar. Tente novamente.' }
    }
    revalidatePath('/painel/profissionais')
    revalidatePath(`/painel/profissionais/${id}`)
  } catch (err) {
    console.error('[atualizarProfissional] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect(`/painel/profissionais/${id}`)
}

export async function mudarStatus(id: string, status: StatusProfissional) {
  if (!['ativo', 'afastado', 'desligado'].includes(status)) {
    return { error: 'Status inválido.' }
  }
  try {
    const supabase = createClient()
    const { error } = await supabase.from('profissionais').update({ status }).eq('id', id)
    if (error) return { error: 'Não foi possível atualizar o status.' }
    revalidatePath('/painel/profissionais')
    revalidatePath(`/painel/profissionais/${id}`)
    return { ok: true }
  } catch (err) {
    console.error('[mudarStatus] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}

export async function salvarCompetencia(id: string, chave: string, valor: number) {
  if (!COMPETENCIAS.some((c) => c.chave === chave)) return { error: 'Competência inválida.' }
  if (!Number.isInteger(valor) || valor < 0 || valor > 5) return { error: 'Valor inválido.' }

  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profissionais')
      .select('competencias')
      .eq('id', id)
      .maybeSingle()

    const atual = (data?.competencias as Record<string, number> | null) ?? {}
    const novo = { ...atual, [chave]: valor }

    const { error } = await supabase.from('profissionais').update({ competencias: novo }).eq('id', id)
    if (error) return { error: 'Não foi possível salvar.' }
    revalidatePath(`/painel/profissionais/${id}`)
    return { ok: true }
  } catch (err) {
    console.error('[salvarCompetencia] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}

const CAMPOS_IA = [
  'motivadores',
  'estilo_comunicacao',
  'pontos_fortes',
  'pontos_desenvolvimento',
  'notas_livres',
] as const

export async function salvarPerfilIA(
  id: string,
  campo: (typeof CAMPOS_IA)[number],
  valor: string[] | string | null
) {
  if (!CAMPOS_IA.includes(campo)) return { error: 'Campo inválido.' }

  let valorFinal: string[] | string | null = valor

  if (campo === 'motivadores') {
    const arr = Array.isArray(valor) ? valor : []
    valorFinal = arr.filter((m) => MOTIVADORES.includes(m)).slice(0, MAX_MOTIVADORES)
  } else if (campo === 'estilo_comunicacao') {
    valorFinal = typeof valor === 'string' && ESTILOS_COMUNICACAO.includes(valor) ? valor : null
  } else {
    valorFinal = typeof valor === 'string' && valor.trim() ? valor.trim() : null
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('profissionais').update({ [campo]: valorFinal }).eq('id', id)
    if (error) return { error: 'Não foi possível salvar.' }
    revalidatePath(`/painel/profissionais/${id}`)
    return { ok: true }
  } catch (err) {
    console.error('[salvarPerfilIA] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}
