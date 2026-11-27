import { requireMembro } from '@/lib/membro'
import { hojeSP } from '@/lib/format'

type Linha = { posicao: number; primeiro_nome: string; cidade: string | null; uf: string | null; percentual: number; sou_eu: boolean }

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MEDALHA = ['🥇', '🥈', '🥉']

export default async function Ranking() {
  const { supabase } = await requireMembro()
  const { data } = await supabase.from('mdc_ranking_mensal').select('*')
  const linhas = (data as Linha[]) ?? []
  const mes = MESES[Number(hojeSP().slice(5, 7)) - 1]
  const podio = linhas.filter((l) => l.posicao <= 3)
  const resto = linhas.filter((l) => l.posicao > 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Ranking de {mes}</h1>
        <p className="text-suave">% das missões e hábitos do mês. Zera todo dia 1º.</p>
      </div>

      {linhas.length === 0 && <p className="card p-6 text-center text-suave">O ranking aparece quando a turma começar.</p>}

      {podio.length > 0 && (
        <ol className="space-y-3">
          {podio.map((l, i) => (
            <li key={i} className={`card flex items-center gap-4 p-5 ${l.posicao === 1 ? 'border-latao bg-latao/5' : ''} ${l.sou_eu ? 'ring-2 ring-latao/50' : ''}`}>
              <span className="text-4xl" aria-label={`${l.posicao}º lugar`}>{MEDALHA[l.posicao - 1]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-black">
                  {l.primeiro_nome}
                  {l.sou_eu && <span className="ml-2 text-sm font-semibold text-latao">(você)</span>}
                </p>
                <p className="text-sm text-suave">{[l.cidade, l.uf].filter(Boolean).join('/') || '—'}</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-linha">
                  <div className="h-full rounded-full bg-latao" style={{ width: `${Math.max(l.percentual, 2)}%` }} />
                </div>
              </div>
              <span className="text-2xl font-black">{l.percentual}%</span>
            </li>
          ))}
        </ol>
      )}

      {resto.length > 0 && (
        <ol className="card divide-y divide-linha">
          {resto.map((l, i) => (
            <li key={i} className={`flex items-center gap-3 p-4 ${l.sou_eu ? 'bg-latao/5' : ''}`}>
              <span className="w-8 text-center font-bold text-suave">{l.posicao}º</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {l.primeiro_nome}
                  {l.sou_eu && <span className="ml-2 text-sm text-latao">(você)</span>}
                  <span className="ml-2 text-sm font-normal text-suave">{[l.cidade, l.uf].filter(Boolean).join('/')}</span>
                </p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-linha">
                  <div className="h-full rounded-full bg-latao/70" style={{ width: `${Math.max(l.percentual, 2)}%` }} />
                </div>
              </div>
              <span className="w-12 text-right font-black">{l.percentual}%</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
