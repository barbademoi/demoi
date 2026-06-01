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
  const cadenciaIn = (formData.get('cadencia_reuniao') as string) || 'semanal'
  const cadencia = ['diaria', 'semanal', 'quinzenal', 'mensal'].includes(cadenciaIn) ? cadenciaIn : 'semanal'
  const diaMesRaw = parseInt(formData.get('dia_mes_reuniao') as string, 10)
  const diaMes = !Number.isNaN(diaMesRaw) && diaMesRaw >= 1 && diaMesRaw <= 31 ? diaMesRaw : 1

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
    // Tenta inserir tudo (com cadência + setor). Se cadencia_reuniao não existe
    // (migration 017 não rodada), tenta sem ela. Mesmo padrão pra setor (migration 010).
    const completo = { ...base, setor, tamanho_equipe: tamanhoEquipe, cadencia_reuniao: cadencia, dia_mes_reuniao: cadencia === 'mensal' ? diaMes : null }
    let { error } = await supabase.from('estabelecimentos').insert(completo)
    if (error) {
      const semCad = await supabase.from('estabelecimentos').insert({ ...base, setor, tamanho_equipe: tamanhoEquipe })
      error = semCad.error
    }
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
