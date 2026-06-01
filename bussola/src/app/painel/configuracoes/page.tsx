import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CONFIG_IA_PADRAO, type ConfigIA } from '@/lib/iaPrompts'
import { MENSAGEM_POS_FEEDBACK_PADRAO } from '@/lib/feedbackCliente'
import ConfiguracoesClient from './ConfiguracoesClient'
import FeedbackClienteSection, { type BrindeUI } from './FeedbackClienteSection'
import LimpezaSection from './LimpezaSection'
import LogoSection from './LogoSection'
import CadenciaSection from './CadenciaSection'
import type { Cadencia } from '@/lib/cadencia'
import { appUrlFromHost } from '@/lib/urlBase'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  // 1) Base — sempre existe. Sem isso, não tem como continuar.
  const { data: base } = await supabase
    .from('estabelecimentos')
    .select('id, nome, config_ia')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!base) redirect('/onboarding')

  const estabId = base.id as string
  const nomeEmpresa = (base.nome as string) ?? ''
  const config = { ...CONFIG_IA_PADRAO, ...((base.config_ia as Partial<ConfigIA> | null) ?? {}) }

  // 2) Feedback de Cliente (migration 012) — independente da 015.
  let feedbackClienteAtivo = false
  let slug: string | null = null
  let mensagem: string = MENSAGEM_POS_FEEDBACK_PADRAO
  const fc = await supabase
    .from('estabelecimentos')
    .select('feedback_cliente_ativo, link_feedback_cliente_slug, mensagem_pos_feedback')
    .eq('id', estabId)
    .maybeSingle()
  if (fc.data) {
    feedbackClienteAtivo = !!fc.data.feedback_cliente_ativo
    slug = (fc.data.link_feedback_cliente_slug as string | null) ?? null
    mensagem = (fc.data.mensagem_pos_feedback as string | null) ?? MENSAGEM_POS_FEEDBACK_PADRAO
  }

  // 3) Logo (migration 015) — independente da 012.
  let logoUrl: string | null = null
  const logo = await supabase
    .from('estabelecimentos')
    .select('logo_url')
    .eq('id', estabId)
    .maybeSingle()
  if (logo.data) {
    logoUrl = (logo.data.logo_url as string | null) ?? null
  }

  // 3.5) Cadência (migration 017) — resiliente se ainda não rodou.
  let cadInicial = {
    cadencia: 'semanal' as Cadencia,
    dia_reuniao: 1 as number | null,
    hora_reuniao: '09:00',
    dia_mes_reuniao: null as number | null,
    incluir_domingos: false,
  }
  try {
    const cd = await supabase
      .from('estabelecimentos')
      .select('cadencia_reuniao, dia_reuniao, hora_reuniao, dia_mes_reuniao, incluir_domingos')
      .eq('id', estabId)
      .maybeSingle()
    if (cd.data) {
      cadInicial = {
        cadencia: ((cd.data.cadencia_reuniao as string) ?? 'semanal') as Cadencia,
        dia_reuniao: (cd.data.dia_reuniao as number | null) ?? 1,
        hora_reuniao: (cd.data.hora_reuniao as string | null) ?? '09:00',
        dia_mes_reuniao: (cd.data.dia_mes_reuniao as number | null) ?? null,
        incluir_domingos: !!cd.data.incluir_domingos,
      }
    }
  } catch {
    /* migration 017 ainda não rodou — usa defaults */
  }

  // 4) Brindes (migration 012) — fallback pra array vazio.
  let brindes: BrindeUI[] = []
  const { data: brindesData } = await supabase
    .from('brindes')
    .select('id, nome, descricao, peso, ativo')
    .eq('estabelecimento_id', estabId)
    .order('created_at', { ascending: true })
  if (brindesData) brindes = brindesData as BrindeUI[]

  const h = headers()
  const origem = appUrlFromHost(h.get('host'))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold text-text">Configurações</h1>
      <LogoSection estabelecimentoId={estabId} nomeEmpresa={nomeEmpresa} logoInicial={logoUrl} />
      <CadenciaSection inicial={cadInicial} />
      <ConfiguracoesClient inicial={config} />
      <FeedbackClienteSection
        ativo={feedbackClienteAtivo}
        slug={slug}
        mensagem={mensagem}
        brindes={brindes}
        origem={origem}
      />
      <LimpezaSection />
      <Link href="/painel/configuracoes/uso-ia" className="block text-sm text-marrom text-center">
        Ver consumo de IA →
      </Link>
      <Link href="/painel/configuracoes/tutoriais" className="block text-sm text-marrom text-center">
        Editar tutoriais (admin) →
      </Link>
    </main>
  )
}
