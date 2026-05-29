import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Avatar from '@/components/Avatar'
import StatusBadge from '@/components/StatusBadge'
import { tempoDeCasa } from '@/lib/tempoDeCasa'
import type { Profissional } from '@/lib/profissionais'
import type { Feedback, FeedbackComProfissional } from '@/lib/feedbacks'
import AcoesStatus from './AcoesStatus'
import LinkProfissional from './LinkProfissional'
import CompetenciasEditor from './CompetenciasEditor'
import PerfilIAEditor from './PerfilIAEditor'
import FeedbacksList from './FeedbacksList'

export default async function PerfilProfissionalPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { novo?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data } = await supabase
    .from('profissionais')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()
  const p = data as Profissional

  const host = headers().get('host') ?? ''
  const proto = host.includes('localhost') ? 'http' : 'https'
  const urlPublica = `${proto}://${host}/p/${p.slug}`

  const tempo = tempoDeCasa(p.data_entrada)
  const destaque = searchParams.novo === '1'

  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('profissional_id', p.id)
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
  const feedbacks = (fbData ?? []) as Feedback[]
  const feedbacksLista: FeedbackComProfissional[] = feedbacks.map((f) => ({ ...f, profissionais: null }))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <Link href="/painel/profissionais" className="text-sm text-chumbo hover:text-marrom">
        ← Colaboradores
      </Link>

      {/* IDENTIFICAÇÃO */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Avatar nome={p.nome} fotoUrl={p.foto_url} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-text">{p.nome}</h1>
              <StatusBadge status={p.status} />
            </div>
            {p.funcao && <p className="text-text-muted text-sm">{p.funcao}</p>}
            {tempo && <p className="text-text-muted text-xs mt-0.5">{tempo}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
          <Link href={`/painel/profissionais/${p.id}/editar`} className="btn-secondary px-4 py-2 text-sm">
            Editar
          </Link>
          <AcoesStatus id={p.id} nome={p.nome} status={p.status} />
        </div>
      </div>

      {/* LINK DO PROFISSIONAL */}
      <LinkProfissional nome={p.nome} url={urlPublica} destaque={destaque} />

      {/* COMPETÊNCIAS */}
      <CompetenciasEditor id={p.id} inicial={p.competencias} />

      {/* PERFIL PARA IA */}
      <PerfilIAEditor
        id={p.id}
        inicial={{
          motivadores: p.motivadores,
          estilo_comunicacao: p.estilo_comunicacao,
          pontos_fortes: p.pontos_fortes,
          pontos_desenvolvimento: p.pontos_desenvolvimento,
          notas_livres: p.notas_livres,
        }}
      />

      {/* OBSERVAÇÕES */}
      <div>
        <h3 className="font-semibold text-text mb-3">Observações</h3>
        <FeedbacksList feedbacks={feedbacksLista} nome={p.nome} />
      </div>
    </main>
  )
}
