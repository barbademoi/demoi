import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import HistoricoClient from './HistoricoClient'
import type { Barbeiro } from '@/types/database'

// Auditoria do dono — sempre fresca, sem cache.
export const dynamic = 'force-dynamic'

type UsuarioRow = { barbearia_id: string; barbearias: { id: string; nome: string } }

/**
 * Tela de HISTÓRICO de lançamentos por barbeiro (auditoria pelo dono).
 *
 * Diferente do modal "Ver lançamentos" no dashboard (janela fixa de 30d), aqui
 * o dono escolhe barbeiro + intervalo livre pra conferir com o sistema dele
 * e ajustar quando precisar. A edição reusa as MESMAS server actions do modal
 * (`lancarDiaComoDono` / `excluirLancamentoDia`) — não há lógica paralela.
 */
export default async function HistoricoLancamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as unknown as UsuarioRow | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, foto_url, tipo, ativo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = (barbeirosRaw ?? []) as Pick<Barbeiro, 'id' | 'nome' | 'foto_url' | 'tipo' | 'ativo'>[]

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <header>
            <h1 className="font-serif text-2xl sm:text-3xl text-text">Histórico de lançamentos</h1>
            <p className="text-text-muted text-sm font-sans mt-1">
              Confira os lançamentos de um barbeiro num intervalo livre e ajuste o que precisar.
            </p>
          </header>

          <HistoricoClient barbeiros={barbeiros} />
        </main>
      </div>
    </div>
  )
}
