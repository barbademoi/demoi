import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Passo3Form from './Passo3Form'

export default async function Passo3Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(modalidade)')
    .eq('id', user.id)
    .single()

  const modalidade = usuarioRaw?.barbearias?.modalidade as string | null

  // Se chegou aqui com modalidade "sozinho", foi por navegação direta — volta pro passo 2
  if (!modalidade || modalidade === 'sozinho') {
    redirect('/onboarding/passo-2')
  }

  return <Passo3Form />
}
