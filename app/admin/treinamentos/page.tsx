import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminTreinamentosClient from './AdminTreinamentosClient'

export const metadata = {
  title: 'Admin — Treinamentos',
}

type Treinamento = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  youtube_id: string
  duracao: string | null
}

type Stats = {
  pendentes: number
  aprovadas_hoje: number
}

export default async function AdminTreinamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (usuarioRaw?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: rows }, { count: pendentes }, { count: aprovadas_hoje }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('treinamentos')
      .select('id, ordem, titulo, descricao, youtube_id, duracao')
      .order('ordem'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('compras_pendentes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('compras_pendentes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('approved_at', new Date(Date.now() - 86_400_000).toISOString()),
  ])

  const stats: Stats = {
    pendentes:      pendentes ?? 0,
    aprovadas_hoje: aprovadas_hoje ?? 0,
  }

  return (
    <AdminTreinamentosClient
      treinamentos={(rows ?? []) as Treinamento[]}
      stats={stats}
    />
  )
}
