import { redirect } from 'next/navigation'
import FormDiagnostico from '@/components/diagnostico/FormDiagnostico'
import { requireMembro } from '@/lib/membro'

export const metadata = { title: 'Reavaliação de 90 dias — MDC' }

export default async function Reavaliacao() {
  const { supabase, user, semana } = await requireMembro()
  if (semana < 13) redirect('/app')
  const { count } = await supabase.from('diagnosticos').select('id', { count: 'exact', head: true }).eq('member_id', user.id).eq('tipo', '90dias')
  if (count) redirect('/app')

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-black">90 dias de MDC</h1>
      <p className="mb-8 mt-2 text-lg text-suave">Hora de olhar pra trás e ver o quanto sua barbearia andou. Responde do jeito que está hoje.</p>
      <FormDiagnostico tipo="90dias" userId={user.id} inicial={{}} />
    </div>
  )
}
