import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { emailTemImportacao } from '@/lib/importacao/access'
import ImportarRelatorioClient from './ImportarRelatorioClient'

export const dynamic = 'force-dynamic'

export default async function ImportarRelatorioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailTemImportacao(user.email ?? null)) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearias(nome)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as { barbearias: { nome: string } | null } | null
  if (!usuario?.barbearias) redirect('/dashboard')

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={usuario.barbearias.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <header>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl text-text">Importar relatório</h1>
              <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-[#D4A85A]/40 text-[#D4A85A]/80">
                EM TESTE
              </span>
            </div>
            <p className="text-text-muted text-sm mt-2 leading-relaxed">
              Leitura diária do acumulado de faturamento e comissão do Agenda Serviço.
            </p>
          </header>

          <ImportarRelatorioClient />
        </main>
      </div>
    </div>
  )
}
