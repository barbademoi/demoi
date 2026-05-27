'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { CATEGORIAS, TIPOS, type EscopoFeedback, type TipoFeedback } from '@/lib/feedbacks'

interface EntradaFeedback {
  escopo: EscopoFeedback
  profissional_id: string | null
  tipo: TipoFeedback
  texto: string
  estrelas: number
  categoria: string | null
}

async function getEstabConfig() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id, mostrar_negativos_profissional, mostrar_observacoes_profissional, atraso_negativo_minutos')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id as string,
    mostrarNeg: data.mostrar_negativos_profissional !== false,
    mostrarObs: data.mostrar_observacoes_profissional !== false,
    atraso: typeof data.atraso_negativo_minutos === 'number' ? data.atraso_negativo_minutos : 5,
  }
}

// Quando o feedback fica visível pro profissional (null = nunca).
function calcularVisivel(
  escopo: EscopoFeedback,
  tipo: TipoFeedback,
  cfg: { mostrarNeg: boolean; mostrarObs: boolean; atraso: number }
): string | null {
  if (escopo !== 'individual') return null
  if (tipo === 'positivo') return new Date().toISOString()
  if (tipo === 'observacao') return cfg.mostrarObs ? new Date().toISOString() : null
  // negativo
  return cfg.mostrarNeg ? new Date(Date.now() + cfg.atraso * 60000).toISOString() : null
}

function validar(input: EntradaFeedback): string | null {
  if (input.escopo !== 'individual' && input.escopo !== 'equipe') return 'Escopo inválido.'
  if (input.escopo === 'individual' && !input.profissional_id) return 'Escolha um profissional.'
  if (!(input.tipo in TIPOS)) return 'Tipo inválido.'
  const texto = (input.texto ?? '').trim()
  if (!texto) return 'Escreva o feedback.'
  if (texto.length > 500) return 'Texto muito longo (máx. 500).'
  if (!Number.isInteger(input.estrelas) || input.estrelas < 1 || input.estrelas > 5) {
    return 'Escolha de 1 a 5 estrelas.'
  }
  if (input.categoria && !CATEGORIAS.includes(input.categoria)) return 'Categoria inválida.'
  return null
}

export async function criarFeedback(input: EntradaFeedback) {
  const erro = validar(input)
  if (erro) return { error: erro }

  try {
    const supabase = createClient()
    const cfg = await getEstabConfig()
    if (!cfg) return { error: 'Sessão expirada. Faça login novamente.' }

    const profId = input.escopo === 'equipe' ? null : input.profissional_id

    // Para feedback individual, garante que o profissional pertence ao estabelecimento.
    if (input.escopo === 'individual') {
      const { data: prof } = await supabase
        .from('profissionais')
        .select('id')
        .eq('id', profId)
        .eq('estabelecimento_id', cfg.id)
        .maybeSingle()
      if (!prof) return { error: 'Profissional inválido.' }
    }

    const visivel = calcularVisivel(input.escopo, input.tipo, cfg)

    const { data: novo, error } = await supabase
      .from('feedbacks')
      .insert({
        escopo: input.escopo,
        profissional_id: profId,
        estabelecimento_id: cfg.id,
        tipo: input.tipo,
        texto: input.texto.trim(),
        estrelas: input.estrelas,
        categoria: input.categoria,
        status: 'pendente',
        visivel_profissional_em: visivel,
      })
      .select('id')
      .single()
    if (error || !novo) {
      console.error('[criarFeedback] erro supabase:', error)
      return { error: 'Não foi possível salvar. Tente novamente.' }
    }

    revalidatePath('/painel')
    if (profId) revalidatePath(`/painel/profissionais/${profId}`)
    revalidatePath('/painel/profissionais')
    revalidatePath('/painel/feedbacks-equipe')
    // Negativo individual entra em carência → cliente mostra o aviso.
    const carencia = input.escopo === 'individual' && input.tipo === 'negativo' && cfg.mostrarNeg
    return { ok: true, id: novo.id as string, atraso: cfg.atraso, carencia }
  } catch (err) {
    console.error('[criarFeedback] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }
}

export async function atualizarFeedback(id: string, input: EntradaFeedback) {
  const erro = validar(input)
  if (erro) return { error: erro }

  try {
    const supabase = createClient()
    const profId = input.escopo === 'equipe' ? null : input.profissional_id
    const { error } = await supabase
      .from('feedbacks')
      .update({
        escopo: input.escopo,
        profissional_id: profId,
        tipo: input.tipo,
        texto: input.texto.trim(),
        estrelas: input.estrelas,
        categoria: input.categoria,
      })
      .eq('id', id)
    if (error) return { error: 'Não foi possível salvar.' }

    revalidatePath('/painel')
    revalidatePath('/painel/profissionais')
    revalidatePath('/painel/feedbacks-equipe')
    if (profId) revalidatePath(`/painel/profissionais/${profId}`)
    return { ok: true }
  } catch (err) {
    console.error('[atualizarFeedback] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}

export async function excluirFeedback(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('feedbacks')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: 'Não foi possível excluir.' }

    revalidatePath('/painel')
    revalidatePath('/painel/profissionais')
    return { ok: true }
  } catch (err) {
    console.error('[excluirFeedback] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}
