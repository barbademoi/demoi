import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Barbeiro } from '@/types/database'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select(`
      barbearia_id,
      barbearias (
        nome, cidade, logo_url, cor_principal,
        dias_trabalhados, horario_abertura, horario_fechamento,
        modalidade, tem_assinatura
      )
    `)
    .eq('id', user.id)
    .single()

  if (!usuarioRaw?.barbearia_id) redirect('/login')

  const barbearia = usuarioRaw.barbearias as {
    nome: string; cidade: string | null; logo_url: string | null; cor_principal: string | null
    dias_trabalhados: { dia: string; ativo: boolean }[] | null
    horario_abertura: string | null; horario_fechamento: string | null
    modalidade: string | null; tem_assinatura: boolean | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', usuarioRaw.barbearia_id)
    .order('nome')

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]

  return (
    <ConfiguracoesClient
      barbearia={barbearia}
      barbeiros={barbeiros}
      email={user.email ?? ''}
    />
  )
}
