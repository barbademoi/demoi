import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Passo2Form from './Passo2Form'

export default async function Passo2Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(dias_trabalhados, horario_abertura, horario_fechamento, modalidade, tem_assinatura)')
    .eq('id', user.id)
    .single()

  const barbearia = usuarioRaw?.barbearias as {
    dias_trabalhados: { dia: string; ativo: boolean }[] | null
    horario_abertura: string | null
    horario_fechamento: string | null
    modalidade: string | null
    tem_assinatura: boolean | null
  } | null

  return <Passo2Form barbearia={barbearia} />
}
