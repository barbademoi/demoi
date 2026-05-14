'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarLinkCodigo } from '@/lib/utils'
import { cookies } from 'next/headers'

export interface BarbeiroInput {
  nome: string
  foto_url: string | null
}

export async function finalizarOnboarding(barbeiros: BarbeiroInput[]) {
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

  if (!barbeiros.length) return { error: 'Adicione ao menos um barbeiro.' }

  const admin = createAdminClient()

  for (const b of barbeiros) {
    if (!b.nome.trim()) continue

    let link_codigo = ''
    for (let i = 0; i < 5; i++) {
      const candidato = gerarLinkCodigo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existe } = await (admin as any)
        .from('barbeiros').select('id').eq('link_codigo', candidato).single()
      if (!existe) { link_codigo = candidato; break }
    }
    if (!link_codigo) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('barbeiros').insert({
      barbearia_id: usuario.barbearia_id,
      nome: b.nome.trim(),
      foto_url: b.foto_url,
      link_codigo,
      tipo: 'barbeiro',
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('barbearias')
    .update({ onboarding_completo: true })
    .eq('id', usuario.barbearia_id)

  cookies().delete('onboarding_required')
  redirect('/dashboard')
}
