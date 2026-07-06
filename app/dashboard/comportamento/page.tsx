import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import ComportamentoClient from './ComportamentoClient'
import type { RegraConduta } from '@/types/database'

export const dynamic = 'force-dynamic'

// Módulo PRIVADO do dono. A página exige sessão autenticada; a RLS garante
// que só o dono da barbearia lê regras/ocorrências. O barbeiro (link público,
// anon key) nunca chega aqui e nem consegue ler as tabelas.
export default async function ComportamentoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, comportamento_ativo)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string; comportamento_ativo: boolean } } | null }
  if (!usuario?.barbearias) redirect('/login')
  const barbearia = usuario.barbearias

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regrasRaw } = await (supabase as any)
    .from('regras_conduta')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .order('created_at', { ascending: true })
  const regras = (regrasRaw ?? []) as RegraConduta[]

  // Conduta aplica a todo mundo que trabalha (barbeiros e recepcionistas).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, tipo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((barbeirosRaw ?? []) as { id: string; nome: string; tipo: string }[])

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <ComportamentoClient
          ativoInicial={barbearia.comportamento_ativo}
          regrasIniciais={regras}
          barbeiros={barbeiros}
        />
      </div>
    </div>
  )
}
