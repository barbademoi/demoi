'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarLinkCodigo } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function salvarOperacao(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string } | null }

  if (!usuario) redirect('/login')

  const DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
  const dias_trabalhados = DIAS.map(dia => ({
    dia,
    ativo: formData.get(`dia_${dia}`) === 'on',
  }))

  const horario_abertura = formData.get('horario_abertura') as string || '09:00'
  const horario_fechamento = formData.get('horario_fechamento') as string || '20:00'
  const modalidade = formData.get('modalidade') as 'sozinho' | 'equipe'
  const tem_assinatura = formData.get('tem_assinatura') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias')
    .update({ dias_trabalhados, horario_abertura, horario_fechamento, modalidade, tem_assinatura })
    .eq('id', usuario.barbearia_id)

  if (error) {
    console.error('[onboarding/passo-2] erro ao salvar:', error)
    return { error: 'Erro ao salvar. Tente novamente.' }
  }

  // Modalidade "sozinho": cria barbeiro automaticamente e finaliza
  if (modalidade === 'sozinho') {
    const nome = (user.user_metadata?.nome as string | undefined)
      ?? user.email?.split('@')[0]
      ?? 'Dono'

    const admin = createAdminClient()
    let link_codigo = ''
    for (let i = 0; i < 5; i++) {
      const candidato = gerarLinkCodigo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existe } = await (admin as any)
        .from('barbeiros').select('id').eq('link_codigo', candidato).single()
      if (!existe) { link_codigo = candidato; break }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('barbeiros')
      .insert({ barbearia_id: usuario.barbearia_id, nome, link_codigo, tipo: 'barbeiro' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('barbearias')
      .update({ onboarding_completo: true })
      .eq('id', usuario.barbearia_id)

    cookies().delete('onboarding_required')
    redirect('/dashboard')
  }

  redirect('/onboarding/passo-3')
}
