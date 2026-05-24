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
    .select('barbearia_id')
    .eq('id', user.id)
    .single()

  if (!usuarioRaw?.barbearia_id) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeariaRaw } = await (supabase as any)
    .from('barbearias')
    .select('nome, cidade, logo_url, cor_principal, dias_trabalhados, horario_abertura, horario_fechamento, modalidade, tem_assinatura, visibilidade_ranking, dia_fechamento')
    .eq('id', usuarioRaw.barbearia_id)
    .single()

  const barbearia = {
    nome: barbeariaRaw?.nome ?? '',
    cidade: barbeariaRaw?.cidade ?? null,
    logo_url: barbeariaRaw?.logo_url ?? null,
    cor_principal: barbeariaRaw?.cor_principal ?? null,
    dias_trabalhados: barbeariaRaw?.dias_trabalhados ?? null,
    horario_abertura: barbeariaRaw?.horario_abertura ?? null,
    horario_fechamento: barbeariaRaw?.horario_fechamento ?? null,
    modalidade: barbeariaRaw?.modalidade ?? null,
    tem_assinatura: barbeariaRaw?.tem_assinatura ?? null,
    visibilidade_ranking: (barbeariaRaw?.visibilidade_ranking ?? null) as 'completo' | 'posicoes' | 'proprio' | null,
    dia_fechamento: (barbeariaRaw?.dia_fechamento as number | null) ?? null,
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
