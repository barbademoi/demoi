import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Passo1Form from './Passo1Form'

export default async function Passo1Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, cidade, logo_url, cor_principal)')
    .eq('id', user.id)
    .single()

  const barbearia = usuarioRaw?.barbearias as {
    nome: string
    cidade: string | null
    logo_url: string | null
    cor_principal: string | null
  } | null

  return <Passo1Form barbearia={barbearia} />
}
