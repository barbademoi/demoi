'use client'

import { detalhePlacar } from '@/lib/tarefix/placarTexto'
import type { EstadoHoje } from '@/lib/tarefix/estadoHoje'
import { datasDoMes, diaDaSemana, mesPorExtenso, NOMES_DIAS_CURTOS } from '@/lib/tarefix/datas'
import { Termometro, fundoMetalico } from '@/components/tarefix/Termometro'

export function MeuMes({ estado }: { estado: EstadoHoje }) {
  const datas = datasDoMes(estado.anoMes)
  const vazios = diaDaSemana(datas[0])
  const folgas = new Set(estado.folgasMes)
  const b = estado.bonus

  return (
    <div className="space-y-5">
      <section className="tf-cartao space-y-4 p-5">
        <h2 className="text-lg font-extrabold first-letter:uppercase">{mesPorExtenso(estado.anoMes)}</h2>
        <Termometro rotulo="No mês" percentual={estado.mes?.percentual ?? null} detalhe={detalhePlacar(estado.mes)} grande />
        <p className="text-sm text-tf-suave">
          {estado.mesRestante.tarefas > 0 ? (
            <>
              Faltam <b className="text-tf-texto">{estado.mesRestante.tarefas} tarefa{estado.mesRestante.tarefas > 1 ? 's' : ''}</b> em {estado.mesRestante.dias} dia{estado.mesRestante.dias > 1 ? 's' : ''}. O termômetro enche conforme você faz: fazendo tudo, o mês fecha em 100%.
            </>
          ) : (
            'Nada mais previsto para este mês.'
          )}
        </p>
        {estado.extrasAprovadasMes > 0 && (
          <p className="font-bold text-tf-marca-texto">
            +{estado.extrasAprovadasMes} extra{estado.extrasAprovadasMes > 1 ? 's' : ''} aprovada{estado.extrasAprovadasMes > 1 ? 's' : ''} no mês
          </p>
        )}
      </section>

      <section className="tf-cartao p-5">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-tf-suave">
          {NOMES_DIAS_CURTOS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: vazios }).map((_, i) => (
            <span key={`v${i}`} />
          ))}
          {datas.map((d) => {
            const p = estado.mesDias[d]
            const temDado = p !== undefined && p !== null
            const futuro = d > estado.hoje
            const folga = folgas.has(d)
            return (
              <div
                key={d}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold ${
                  temDado ? 'text-white' : folga ? 'border border-dashed border-tf-borda text-tf-suave' : 'bg-tf-fundo text-tf-suave'
                } ${futuro ? 'opacity-50' : ''} ${d === estado.hoje ? 'ring-2 ring-tf-marca ring-offset-1 ring-offset-tf-card' : ''}`}
                style={temDado ? { background: fundoMetalico(p), textShadow: '0 1px 1px rgba(0,0,0,.35)' } : undefined}
                title={temDado ? `${p}%` : folga ? 'folga' : undefined}
              >
                {Number(d.slice(8))}
                {temDado && <span className="text-[10px] font-extrabold leading-none opacity-90">{p}%</span>}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-tf-suave">Cada dia ganha a cor do seu percentual. Tracejado = folga.</p>
      </section>

      {b && (
        <section className="tf-cartao space-y-3 p-5">
          <h2 className="text-lg font-extrabold">Bônus do mês</h2>
          {b.proximo && b.falta !== null && (
            <p className="font-bold">
              Faltam {b.falta}% para {b.atingido ? 'o próximo nível' : 'o bônus'} ({b.proximo.premio}).
            </p>
          )}
          {!b.proximo && b.atingido && <p className="font-bold">Nível máximo alcançado até agora!</p>}
          <ul className="space-y-2">
            {b.niveis.map((n) => {
              const ok = (estado.mes?.percentual ?? 0) >= n.percentual
              return (
                <li key={n.percentual} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${ok ? 'border-tf-marca bg-tf-marca-clara' : 'border-tf-borda'}`}>
                  <span className="font-bold">{n.percentual}% no mês</span>
                  <span className="flex items-center gap-2 font-extrabold">
                    {n.premio}
                    {ok && <span className="text-tf-marca-texto">✓</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-tf-suave">O valor final é confirmado no fechamento do mês.</p>
        </section>
      )}
    </div>
  )
}
