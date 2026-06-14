import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import PainelClient from './PainelClient'
import FeedbackGate from '@/components/feedback/FeedbackGate'
import { dataLocalStr } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CHECKOUT_COMBO_URL = 'https://pay.hotmart.com/K106318479K'

export default async function PainelFeedbacksPage({
  searchParams,
}: { searchParams?: { periodo?: string; estrelas?: string; comComentario?: string; barbeiroId?: string; brindeId?: string; arquivados?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id).single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string } } | null }
  if (!usuario?.barbearias) redirect('/login')

  // Filtros
  const periodo = searchParams?.periodo ?? '30'   // dias atras
  const estrelas = searchParams?.estrelas ?? 'todas'
  const comComentario = searchParams?.comComentario === '1'
  const barbeiroIdFiltro = searchParams?.barbeiroId ?? ''
  const brindeIdFiltro = searchParams?.brindeId ?? ''
  const verArquivados = searchParams?.arquivados === '1'

  // Datas pra periodo
  const dias = Math.max(1, Math.min(365, parseInt(periodo) || 30))
  const hoje = new Date()
  const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - dias + 1)
  const inicioStr = dataLocalStr(inicio)

  // Query base de feedbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from('feedbacks_cliente')
    .select('*, brindes(nome, foto_url), barbeiros(nome, foto_url)')
    .eq('barbearia_id', usuario.barbearias.id)
    .eq('arquivado', verArquivados)
    .gte('data', inicioStr)
    .order('created_at', { ascending: false })

  if (estrelas !== 'todas') q = q.eq('estrelas', parseInt(estrelas))
  if (comComentario) q = q.not('comentario', 'is', null)
  if (barbeiroIdFiltro) q = q.eq('barbeiro_id', barbeiroIdFiltro)
  if (brindeIdFiltro) q = q.eq('brinde_id', brindeIdFiltro)

  const { data: feedbacksRaw } = await q
  const feedbacks = (feedbacksRaw ?? []) as Array<{
    id: string; barbearia_id: string; barbeiro_id: string | null
    estrelas: number; comentario: string | null
    nome_cliente: string | null; contato_cliente: string | null
    brinde_id: string | null; codigo_resgate: string | null
    brinde_usado: boolean; pontos_concedidos: number
    lido: boolean; arquivado: boolean
    data: string; created_at: string
    brindes: { nome: string; foto_url: string | null } | null
    barbeiros: { nome: string; foto_url: string | null } | null
  }>

  // Contadores (independente dos filtros, escopo do mês e geral)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: novos } = await (supabase as any).from('feedbacks_cliente')
    .select('id', { count: 'exact', head: true })
    .eq('barbearia_id', usuario.barbearias.id).eq('lido', false).eq('arquivado', false)
  const semana = new Date(hoje); semana.setDate(semana.getDate() - 6)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: semanaCount } = await (supabase as any).from('feedbacks_cliente')
    .select('id', { count: 'exact', head: true })
    .eq('barbearia_id', usuario.barbearias.id).eq('arquivado', false)
    .gte('data', dataLocalStr(semana))
  const mes = new Date(hoje); mes.setDate(mes.getDate() - 29)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mesEstrelasRaw } = await (supabase as any).from('feedbacks_cliente')
    .select('estrelas')
    .eq('barbearia_id', usuario.barbearias.id).eq('arquivado', false)
    .gte('data', dataLocalStr(mes))
  const mesEstrelas = (mesEstrelasRaw ?? []) as { estrelas: number }[]
  const mediaEstrelas = mesEstrelas.length > 0
    ? mesEstrelas.reduce((s, x) => s + x.estrelas, 0) / mesEstrelas.length
    : 0

  // Lookups pra filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any).from('barbeiros')
    .select('id, nome').eq('barbearia_id', usuario.barbearias.id).eq('ativo', true).order('nome')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brindesRaw } = await (supabase as any).from('brindes')
    .select('id, nome').eq('barbearia_id', usuario.barbearias.id).order('nome')

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={usuario.barbearias.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <FeedbackGate checkoutUrl={CHECKOUT_COMBO_URL}>
          <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-text">Feedbacks de Cliente</h1>
                <p className="text-text-muted text-sm font-sans mt-1">
                  Lista de avaliações recebidas. Filtra, marca como lido e gerencia brindes.
                </p>
              </div>
              <Link href="/dashboard/feedback-cliente" className="btn-ghost text-xs py-2 px-3 border border-border whitespace-nowrap">
                ⚙ Configurações
              </Link>
            </header>

            {/* Contadores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Novos" valor={String(novos ?? 0)} highlight={(novos ?? 0) > 0} />
              <Stat label="Última semana" valor={String(semanaCount ?? 0)} />
              <Stat label="Últimos 30 dias" valor={String(mesEstrelas.length)} />
              <Stat label="Média ★ (30d)" valor={mediaEstrelas > 0 ? mediaEstrelas.toFixed(1) : '—'} />
            </div>

            <PainelClient
              feedbacks={feedbacks}
              barbeiros={(barbeirosRaw ?? []) as { id: string; nome: string }[]}
              brindes={(brindesRaw ?? []) as { id: string; nome: string }[]}
              filtros={{ periodo, estrelas, comComentario, barbeiroId: barbeiroIdFiltro, brindeId: brindeIdFiltro, arquivados: verArquivados }}
            />
          </main>
        </FeedbackGate>
      </div>
    </div>
  )
}

function Stat({ label, valor, highlight }: { label: string; valor: string; highlight?: boolean }) {
  return (
    <div className={`card p-3 ${highlight ? 'border-primary/40 bg-primary/5' : ''}`}>
      <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">{label}</p>
      <p className={`font-serif text-xl sm:text-2xl mt-1 ${highlight ? 'text-primary' : 'text-text'}`}>{valor}</p>
    </div>
  )
}
