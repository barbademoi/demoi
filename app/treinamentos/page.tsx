import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TreinamentosClient from './TreinamentosClient'

export const metadata = {
  title: 'Treinamentos — BarberMeta',
}

export default async function TreinamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <TreinamentosClient />
}
