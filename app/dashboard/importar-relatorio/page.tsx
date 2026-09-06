import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/server'
import DeParaClient from './DeParaClient'

export const metadata = { title: 'Importar relatório — BarberMeta' }
export const dynamic = 'force-dynamic'

export interface LinhaDePara {
  nomeOrigem: string
  nomeExibicao: string
  barbeiroId: string | null
  ignorar: boolean
  vezes: number
  vistoEm: string
}

export default async function ImportarRelatorioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios').select('barbearia_id, barbearias(nome)').eq('id', user.id).single()
  const usuario = usuarioRaw as { barbearia_id: string; barbearias: { nome: string } | null } | null
  if (!usuario?.barbearia_id) redirect('/dashboard')

  const [{ data: deparaRaw }, { data: barbsRaw }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('import_agenda_depara')
      .select('nome_origem, nome_exibicao, barbeiro_id, ignorar, vezes, visto_em')
      .eq('barbearia_id', usuario.barbearia_id)
      .order('visto_em', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('barbeiros')
      .select('id, nome').eq('barbearia_id', usuario.barbearia_id).eq('ativo', true).order('nome'),
  ])

  type Row = {
    nome_origem: string; nome_exibicao: string; barbeiro_id: string | null
    ignorar: boolean; vezes: number; visto_em: string
  }
  const linhas: LinhaDePara[] = ((deparaRaw ?? []) as Row[]).map(r => ({
    nomeOrigem: r.nome_origem,
    nomeExibicao: r.nome_exibicao,
    barbeiroId: r.barbeiro_id,
    ignorar: r.ignorar,
    vezes: Number(r.vezes) || 0,
    vistoEm: r.visto_em,
  }))

  const barbeiros = ((barbsRaw ?? []) as { id: string; nome: string }[])

  return (
    <div className="bm-theme min-h-screen flex">
      <Sidebar barbeariaNome={usuario.barbearias?.nome ?? 'Barbearia'} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 lg:pl-[calc(16rem+2rem)] lg:pr-8 lg:pt-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Agenda Serviço</p>
            <h1 className="mt-2 font-serif text-3xl text-text sm:text-4xl">Importar relatório</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Quando um nome do relatório não bate com nenhum barbeiro daqui, ele aparece nesta
              lista. Confirme uma vez a quem ele corresponde e, a partir daí, toda importação
              reconhece sozinha — sem você precisar renomear ninguém.
            </p>
          </div>

          <DeParaClient linhas={linhas} barbeiros={barbeiros} />
        </div>
      </main>
    </div>
  )
}
