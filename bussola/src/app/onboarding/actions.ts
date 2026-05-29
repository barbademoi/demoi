'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function criarEstabelecimento(formData: FormData) {
  const nome = (formData.get('nome') as string)?.trim()
  const endereco = (formData.get('endereco') as string)?.trim() || null
  const setor = (formData.get('setor') as string)?.trim() || null
  const tamanhoEquipe = (formData.get('tamanho_equipe') as string)?.trim() || null
  const diaReuniao = parseInt(formData.get('dia_reuniao') as string, 10)
  const horaReuniao = (formData.get('hora_reuniao') as string) || '09:00'

  if (!nome) {
    return { error: 'Informe o nome da empresa.' }
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Sessão expirada. Faça login novamente.' }
    }

    // setor e tamanho_equipe podem não existir no banco ainda (migration 010);
    // tenta com eles primeiro e cai pra inserção mínima se der erro.
    const base = {
      dono_id: user.id,
      nome,
      endereco,
      dia_reuniao: Number.isNaN(diaReuniao) ? 1 : diaReuniao,
      hora_reuniao: horaReuniao,
    }
    let { error } = await supabase.from('estabelecimentos').insert({ ...base, setor, tamanho_equipe: tamanhoEquipe })
    if (error) {
      const tentativa = await supabase.from('estabelecimentos').insert(base)
      error = tentativa.error
    }

    if (error) {
      console.error('[criarEstabelecimento] erro do supabase:', error)
      return { error: 'Não foi possível salvar. Tente novamente.' }
    }

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[criarEstabelecimento] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect('/painel')
}
