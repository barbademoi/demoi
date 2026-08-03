import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarCortesias } from './actions'
import AdminCortesiasClient from './AdminCortesiasClient'

export const metadata = {
  title: 'Admin — Conceder acesso',
}

export default async function AdminCortesiasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Proteção no servidor: só o e-mail admin acessa a página (e as actions
  // re-checam por conta própria).
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const { cortesias } = await listarCortesias()
  return <AdminCortesiasClient cortesiasIniciais={cortesias} />
}
