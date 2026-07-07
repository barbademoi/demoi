import { createAdminClient } from '@/lib/supabase/admin'
import FeedbackClienteForm from './FeedbackClienteForm'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function FeedbackClientePublicPage({ params }: Props) {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barb } = await (admin as any)
    .from('barbearias').select('id, nome, logo_url, cor_principal, feedback_ativo, feedback_slug')
    .eq('feedback_slug', params.slug)
    .eq('feedback_ativo', true)
    .maybeSingle()

  if (!barb) {
    return (
      <div className="bm-theme min-h-screen flex items-center justify-center p-6">
        <div className="card-light p-8 max-w-md text-center space-y-2">
          <p className="text-4xl">🔒</p>
          <h1 className="font-serif text-xl text-on-cream">Link não disponível</h1>
          <p className="text-on-cream-muted text-sm font-sans">
            A barbearia não está mais coletando feedbacks ou o link está incorreto.
          </p>
        </div>
      </div>
    )
  }

  // Barbeiros ativos (pra "Quem te atendeu?")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbRaw } = await (admin as any)
    .from('barbeiros').select('id, nome, foto_url')
    .eq('barbearia_id', barb.id).eq('ativo', true).neq('tipo', 'recepcionista')
    .order('nome')

  const barbeiros = (barbRaw ?? []) as { id: string; nome: string; foto_url: string | null }[]

  return (
    <div className="bm-theme min-h-screen p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-6">
          {barb.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={barb.logo_url} alt={barb.nome} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
          ) : null}
          <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Feedback</p>
          <h1 className="font-serif text-2xl text-text">{barb.nome}</h1>
        </header>

        <FeedbackClienteForm slug={params.slug} barbeiros={barbeiros} />
      </div>
    </div>
  )
}
