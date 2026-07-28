import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cicloAtual, hojeBrasil } from '@/lib/ciclo'
import { emailTemImportacao } from '@/lib/importacao/access'
import { valorBase, type BaseMeta, type ModoMeta } from '@/lib/modoMeta'
import Sidebar from '@/components/dashboard/Sidebar'
import ImportacaoClient from './ImportacaoClient'

export const dynamic = 'force-dynamic'

export default async function ImportarDadosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailTemImportacao(user.email ?? null)) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, dia_fechamento, modo_meta, base_meta)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as {
    barbearia_id: string
    barbearias: {
      id: string
      nome: string
      dia_fechamento: number | null
      modo_meta: ModoMeta | null
      base_meta: BaseMeta | null
    } | null
  } | null
  if (!usuario?.barbearias) redirect('/dashboard')

  const barbearia = usuario.barbearias
  const modoMeta = barbearia.modo_meta ?? 'comissao'
  const baseMeta = valorBase(modoMeta, barbearia.base_meta)
  const ciclo = cicloAtual(barbearia.dia_fechamento ?? 1, hojeBrasil())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, tipo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((barbeirosRaw ?? []) as Array<{
    id: string
    nome: string
    tipo: 'barbeiro' | 'recepcionista'
  }>).filter(b => b.tipo !== 'recepcionista')

  let lotesRecentes: Array<{
    id: string
    arquivo_nome: string
    tipo_valor: 'faturamento' | 'comissao'
    lancamentos_aplicados: number
    lancamentos_ignorados: number
    total_aplicado: number
    confirmado_em: string
  }> = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('importacao_lotes')
      .select('id, arquivo_nome, tipo_valor, lancamentos_aplicados, lancamentos_ignorados, total_aplicado, confirmado_em')
      .eq('barbearia_id', barbearia.id)
      .order('confirmado_em', { ascending: false })
      .limit(5)
    lotesRecentes = (data ?? []) as typeof lotesRecentes
  } catch {
    // Migration ainda não aplicada: o fluxo exibirá um erro antes de gravar.
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <header>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl text-text">Importar dados</h1>
              <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-[#D4A85A]/40 text-[#D4A85A]/80">
                EM TESTE
              </span>
            </div>
            <p className="text-text-muted text-sm font-sans mt-2 leading-relaxed">
              Importe CSV, Excel ou PDF com mapeamento manual. Ciclo aceito:{' '}
              <span className="text-text font-semibold capitalize">{ciclo.label}</span>.
            </p>
          </header>

          <ImportacaoClient
            barbeiros={barbeiros}
            modoMeta={modoMeta}
            baseMeta={baseMeta}
            cicloInicio={ciclo.inicioIso}
            cicloFim={ciclo.fimIso}
            lotesRecentes={lotesRecentes}
          />
        </main>
      </div>
    </div>
  )
}
