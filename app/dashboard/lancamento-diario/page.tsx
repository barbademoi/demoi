import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nomeMes } from '@/lib/utils'
import LancamentoDiarioClient from './LancamentoDiarioClient'
import Sidebar from '@/components/dashboard/Sidebar'
import type { Barbeiro } from '@/types/database'

type UsuarioRow = { barbearia_id: string; barbearias: { id: string; nome: string } }

function pad2(n: number) { return String(n).padStart(2, '0') }

export default async function LancamentoDiarioPage() {
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

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  // Barbeiros ativos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, foto_url, tipo, ativo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = (barbeirosRaw ?? []) as Pick<Barbeiro, 'id' | 'nome' | 'foto_url' | 'tipo' | 'ativo'>[]

  // Comandas diárias do mês atual (todos os dias, todos os barbeiros)
  const primeiroDia = `${ano}-${pad2(mes)}-01`
  const ultimoDia = `${ano}-${pad2(mes)}-${pad2(new Date(ano, mes, 0).getDate())}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, data, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .gte('data', primeiroDia)
    .lte('data', ultimoDia)
    .order('data', { ascending: false })

  const comandasDiarias = (ldRaw ?? []) as { barbeiro_id: string; data: string; numero_atendimentos: number }[]

  // Acumulado do mês
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('faturamento_acumulado, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancMensaisRaw } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const lancPorBarbeiro = (lancMensaisRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number; numero_atendimentos: number }[]
  const acumuladoPorBarbeiro: Record<string, { comissao: number; atendimentos: number }> = {}
  for (const l of lancPorBarbeiro) {
    acumuladoPorBarbeiro[l.barbeiro_id] = {
      comissao: Number(l.comissao_acumulada) || 0,
      atendimentos: Number(l.numero_atendimentos) || 0,
    }
  }

  const totalComissoesMes = lancPorBarbeiro.reduce((s, l) => s + (Number(l.comissao_acumulada) || 0), 0)
  const totalAtendimentosMes = lancPorBarbeiro.reduce((s, l) => s + (Number(l.numero_atendimentos) || 0), 0)
  const faturamentoCasaAtual = Number(metaRaw?.faturamento_acumulado) || 0
  const atendimentosCasaAtual = Number(metaRaw?.numero_atendimentos) || 0
  const faturamentoMes = faturamentoCasaAtual > 0 ? faturamentoCasaAtual : totalComissoesMes
  // Total de atendimentos exibido: prefere o coletivo da casa; senão a soma por barbeiro
  const atendimentosMesExibido = atendimentosCasaAtual > 0 ? atendimentosCasaAtual : totalAtendimentosMes

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <header>
            <h1 className="font-serif text-2xl sm:text-3xl text-text">Lançamento diário</h1>
            <p className="text-text-muted text-sm font-sans mt-1">
              {nomeMes(mes)} {ano}
            </p>
          </header>

          <LancamentoDiarioClient
            barbeiros={barbeiros}
            comandasDiarias={comandasDiarias}
            acumuladoPorBarbeiro={acumuladoPorBarbeiro}
            faturamentoCasaAtual={faturamentoCasaAtual}
            atendimentosCasaAtual={atendimentosCasaAtual}
            faturamentoMes={faturamentoMes}
            totalComissoesMes={totalComissoesMes}
            totalAtendimentosMes={atendimentosMesExibido}
            mes={mes}
            ano={ano}
          />
        </main>
      </div>
    </div>
  )
}
