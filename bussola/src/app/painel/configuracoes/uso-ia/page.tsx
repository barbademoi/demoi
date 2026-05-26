import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo } from '@/lib/periodos'

export const dynamic = 'force-dynamic'

const LABELS: Record<string, string> = {
  fala_reuniao: 'Sugestões de fala',
  categoria_feedback: 'Categorizações',
  mensagem_whatsapp: 'Mensagens personalizadas',
  resumo_semana: 'Resumos de semana',
}

// Preço Haiku 4.5: US$ 1,00 / 1M tokens de entrada · US$ 5,00 / 1M de saída.
const PRECO_IN = 1 / 1_000_000
const PRECO_OUT = 5 / 1_000_000

interface Linha {
  tipo: string
  prompt_tokens: number | null
  completion_tokens: number | null
}

export default async function UsoIAPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase.from('estabelecimentos').select('id').eq('dono_id', user.id).maybeSingle()
  if (!est) redirect('/onboarding')

  const mes = intervalo('mes')
  const { data } = await supabase
    .from('sugestoes_ia')
    .select('tipo, prompt_tokens, completion_tokens')
    .eq('estabelecimento_id', est.id)
    .gte('created_at', mes.inicio.toISOString())
    .lte('created_at', mes.fim.toISOString())
  const linhas = (data ?? []) as Linha[]

  const porTipo: Record<string, { n: number; inp: number; out: number }> = {}
  for (const l of linhas) {
    const t = (porTipo[l.tipo] ??= { n: 0, inp: 0, out: 0 })
    t.n += 1
    t.inp += l.prompt_tokens ?? 0
    t.out += l.completion_tokens ?? 0
  }

  const totalIn = linhas.reduce((s, l) => s + (l.prompt_tokens ?? 0), 0)
  const totalOut = linhas.reduce((s, l) => s + (l.completion_tokens ?? 0), 0)
  const custoUSD = totalIn * PRECO_IN + totalOut * PRECO_OUT

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <Link href="/painel/configuracoes" className="text-sm text-text-muted hover:text-primary">← Configurações</Link>
      <h1 className="text-xl font-bold text-text">Consumo de IA — este mês</h1>

      <div className="card p-5 text-center">
        <p className="text-text-muted text-sm">Custo estimado no mês</p>
        <p className="text-3xl font-bold text-primary mt-1">US$ {custoUSD.toFixed(4)}</p>
        <p className="text-xs text-text-muted mt-1">{linhas.length} chamadas · {(totalIn + totalOut).toLocaleString('pt-BR')} tokens</p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-text mb-3">Por tipo</h2>
        <div className="space-y-2">
          {Object.keys(LABELS).map((tipo) => {
            const t = porTipo[tipo] ?? { n: 0, inp: 0, out: 0 }
            return (
              <div key={tipo} className="flex items-center justify-between text-sm">
                <span className="text-text">{LABELS[tipo]}</span>
                <span className="text-text-muted">{t.n} · {(t.inp + t.out).toLocaleString('pt-BR')} tokens</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        Estimativa com base no preço do modelo Haiku 4.5. Sem limite por enquanto.
      </p>
    </main>
  )
}
