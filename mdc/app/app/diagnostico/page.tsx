import { redirect } from 'next/navigation'
import FormDiagnostico from '@/components/diagnostico/FormDiagnostico'
import { requireMembro } from '@/lib/membro'
import { formatarWhatsapp } from '@/lib/format'

export const metadata = { title: 'Diagnóstico de entrada — MDC' }

export default async function Diagnostico() {
  const { supabase, user, membro } = await requireMembro({ semDiagnostico: true })
  const { count } = await supabase.from('mdc_diagnosticos').select('id', { count: 'exact', head: true }).eq('member_id', user.id).eq('tipo', 'entrada')
  if (count) redirect('/app')

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-black">Bem-vindo ao MDC, {membro.nome.split(' ')[0]}!</h1>
      <p className="mb-8 mt-2 text-lg text-suave">
        Antes de começar, preciso conhecer sua barbearia. São 6 partes rápidas. Responde com sinceridade: é isso que guia suas missões.
      </p>
      <FormDiagnostico
        tipo="entrada"
        userId={user.id}
        inicial={{ nome: membro.nome, whatsapp: formatarWhatsapp(membro.whatsapp), cidade: membro.cidade ?? '', uf: membro.uf ?? '' }}
      />
    </div>
  )
}
