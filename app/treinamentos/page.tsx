import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TreinamentosClient from './TreinamentosClient'

export const metadata = {
  title: 'Treinamentos — BarberMeta',
}

type Treinamento = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  youtube_id: string
  duracao: string | null
}

export default async function TreinamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('treinamentos')
    .select('id, ordem, titulo, descricao, youtube_id, duracao')
    .order('ordem')

  const treinamentos: Treinamento[] = (rows ?? []).filter(
    (r: Treinamento) => r.youtube_id && !r.youtube_id.startsWith('PLACEHOLDER'),
  )

  return <TreinamentosClient treinamentos={treinamentos} />
}
