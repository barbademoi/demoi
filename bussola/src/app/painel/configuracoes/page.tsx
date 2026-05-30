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

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  // Tenta o select completo; se as colunas novas do PROMPT G ainda não
  // existirem (migration 012), cai num mínimo pra não travar a página.
  let estabId: string | null = null
  let nomeEmpresa: string = ''
  let logoUrl: string | null = null
  let configIa: Partial<ConfigIA> | null = null
  let feedbackClienteAtivo = false
  let slug: string | null = null
  let mensagem: string = MENSAGEM_POS_FEEDBACK_PADRAO

  const completo = await supabase
    .from('estabelecimentos')
    .select('id, nome, logo_url, config_ia, feedback_cliente_ativo, link_feedback_cliente_slug, mensagem_pos_feedback')
    .eq('dono_id', user.id)
    .maybeSingle()

  if (completo.data) {
    estabId = completo.data.id as string
    nomeEmpresa = (completo.data.nome as string) ?? ''
    logoUrl = (completo.data.logo_url as string | null) ?? null
    configIa = completo.data.config_ia as Partial<ConfigIA> | null
    feedbackClienteAtivo = !!completo.data.feedback_cliente_ativo
    slug = (completo.data.link_feedback_cliente_slug as string | null) ?? null
    mensagem = (completo.data.mensagem_pos_feedback as string | null) ?? MENSAGEM_POS_FEEDBACK_PADRAO
  } else {
    const minimo = await supabase
      .from('estabelecimentos')
      .select('id, nome, config_ia')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!minimo.data) redirect('/onboarding')
    estabId = minimo.data.id as string
    nomeEmpresa = (minimo.data.nome as string) ?? ''
    configIa = minimo.data.config_ia as Partial<ConfigIA> | null
  }

  const config = { ...CONFIG_IA_PADRAO, ...(configIa ?? {}) }

  // Brindes — fallback pra array vazio se a tabela ainda não existir.
  let brindes: BrindeUI[] = []
  if (estabId) {
    const { data: brindesData } = await supabase
      .from('brindes')
      .select('id, nome, descricao, peso, ativo')
      .eq('estabelecimento_id', estabId)
      .order('created_at', { ascending: true })
    brindes = (brindesData ?? []) as BrindeUI[]
  }

  const h = headers()
  const host = h.get('host') ?? ''
  const proto = host.includes('localhost') ? 'http' : 'https'
  const origem = `${proto}://${host}`

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold text-text">Configurações</h1>
      {estabId && (
        <LogoSection estabelecimentoId={estabId} nomeEmpresa={nomeEmpresa} logoInicial={logoUrl} />
      )}
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
    </main>
  )
}
