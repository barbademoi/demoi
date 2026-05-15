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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('treinamentos')
    .select('id, ordem, titulo, descricao, youtube_id, duracao')
    .order('ordem')

  return <AdminTreinamentosClient treinamentos={(rows ?? []) as Treinamento[]} />
}
