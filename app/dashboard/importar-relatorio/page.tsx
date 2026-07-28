import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { obterAcessoImportacaoAgenda } from '@/lib/importacao-agenda/acesso-server'
import { normalizarNomeAgenda } from '@/lib/importacao-agenda/server'
import type {
  BarbeiroDisponivelAgenda,
  MapeamentoSalvoAgenda,
} from '@/lib/importacao-agenda/types'
import ImportarRelatorioClient from './ImportarRelatorioClient'

export const dynamic = 'force-dynamic'

export default async function ImportarRelatorioPage() {
  const acesso = await obterAcessoImportacaoAgenda()
  if ('error' in acesso) {
    if (acesso.status === 401) redirect('/login')
    redirect('/dashboard')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (acesso.supabase as any)
    .from('barbeiros')
    .select('id, nome, tipo')
    .eq('barbearia_id', acesso.barbeariaId)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((barbeirosRaw ?? []) as Array<BarbeiroDisponivelAgenda & { tipo: string | null }>)
    .filter(barbeiro => barbeiro.tipo !== 'recepcionista')
    .map(({ id, nome }) => ({ id, nome }))

  // Se a migration ainda não tiver sido aplicada, a tela continua abrindo sem
  // de-para salvo; a confirmação continuará bloqueada pelo servidor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mapeamentosRaw } = await (acesso.supabase as any)
    .from('importacao_agenda_mapeamentos')
    .select('nome_relatorio_chave, barbeiro_id')
    .eq('barbearia_id', acesso.barbeariaId)
  const mapeamentosSalvos = ((mapeamentosRaw ?? []) as Array<{
    nome_relatorio_chave: string
    barbeiro_id: string
  }>).map(item => ({
    nomeRelatorioChave: normalizarNomeAgenda(item.nome_relatorio_chave),
    barbeiroId: item.barbeiro_id,
  })) satisfies MapeamentoSalvoAgenda[]

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={acesso.barbeariaNome} />
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

          <ImportarRelatorioClient
            barbeiros={barbeiros}
            mapeamentosSalvos={mapeamentosSalvos}
          />
        </main>
      </div>
    </div>
  )
}
