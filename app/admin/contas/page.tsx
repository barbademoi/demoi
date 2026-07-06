import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminContasClient from './AdminContasClient'

export const metadata = {
  title: 'Admin — Contas',
}

export default async function AdminContasPage() {
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

  return <AdminContasClient />
}
