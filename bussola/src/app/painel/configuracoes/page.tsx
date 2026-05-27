import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CONFIG_IA_PADRAO, type ConfigIA } from '@/lib/iaPrompts'
import ConfiguracoesClient from './ConfiguracoesClient'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('config_ia, mostrar_negativos_profissional, mostrar_observacoes_profissional, atraso_negativo_minutos')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const config = { ...CONFIG_IA_PADRAO, ...((est.config_ia as Partial<ConfigIA> | null) ?? {}) }

  const visibilidade = {
    mostrar_negativos_profissional: est.mostrar_negativos_profissional !== false,
    mostrar_observacoes_profissional: est.mostrar_observacoes_profissional !== false,
    atraso_negativo_minutos:
      typeof est.atraso_negativo_minutos === 'number' ? est.atraso_negativo_minutos : 5,
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-text">Configurações</h1>
      <ConfiguracoesClient inicial={config} visInicial={visibilidade} />
      <Link href="/painel/configuracoes/uso-ia" className="block text-sm text-primary text-center">
        Ver consumo de IA →
      </Link>
    </main>
  )
}
