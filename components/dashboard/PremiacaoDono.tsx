'use client'

import { useState } from 'react'
import { formatBRL } from '@/lib/utils'
import type { PremiacaoResumo } from '@/lib/premios'

// Bloco "PREMIAÇÃO DO MÊS" do dono — ótica de CUSTO/compromisso a pagar.
// Total já garantido (soma dos individuais dos barbeiros) + potencial (projeção)
// + detalhe por barbeiro ao expandir. Só o dono vê. Some se não há premiação.
export default function PremiacaoDono({
  premiacao,
  baseMeta,
}: {
  premiacao: PremiacaoResumo
  baseMeta: 'faturamento' | 'comissao'
}) {
  const [aberto, setAberto] = useState(false)
  if (!premiacao.temPremiacao) return null

  const comPremio = premiacao.barbeiros.filter(b => b.jaGarantido > 0 || b.potencialProximo > 0)
  const acrescimoPremios = Math.max(0, premiacao.totalPotencial - premiacao.totalJaGarantido)
  const potencialLabel = baseMeta === 'faturamento'
    ? 'Potencial de faturamento'
    : 'Potencial de comissões'
  const niveis = [
    { nome: 'Bronze', valor: premiacao.potencialMetasEquipe.bronze, classe: 'metal-text-bronze' },
    { nome: 'Prata', valor: premiacao.potencialMetasEquipe.prata, classe: 'metal-text-silver' },
    { nome: 'Ouro', valor: premiacao.potencialMetasEquipe.ouro, classe: 'metal-text-gold' },
  ]

  return (
    <section className="card p-6 border border-[#D4A85A]/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-xl text-text">🏆 Premiação do mês</h2>
          <p className="text-text-muted text-xs font-sans mt-0.5">O que a barbearia se comprometeu a pagar em prêmios este mês.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-600/30 bg-green-500/5 p-4">
          <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Já garantido (a pagar)</p>
          <p className="font-serif text-3xl text-text tabular-nums mt-1">{formatBRL(premiacao.totalJaGarantido)}</p>
          <p className="text-text-muted text-xs font-sans mt-1">Valor que a barbearia já deve pagar por metas batidas e campanha.</p>

          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
            <p className="text-amber-400 text-[11px] font-sans font-semibold uppercase tracking-wide">
              Projeção do custo com prêmios
            </p>
            <p className="text-text text-sm font-sans mt-1 leading-relaxed">
              Se todos avançarem nos próximos níveis, o total de prêmios pode chegar a{' '}
              <strong className="tabular-nums">{formatBRL(premiacao.totalPotencial)}</strong>.
            </p>
            <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
              Esse total já inclui os {formatBRL(premiacao.totalJaGarantido)} garantidos acima.
              Acréscimo possível neste cenário: {formatBRL(acrescimoPremios)}.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">
            {potencialLabel} <span className="text-amber-500">· projeção</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {niveis.map(nivel => (
              <div key={nivel.nome} className="min-w-0 rounded-lg border border-border bg-surface px-2 py-3 text-center">
                <p className={`text-[10px] sm:text-[11px] font-sans uppercase tracking-wide ${nivel.classe}`}>
                  {nivel.nome}
                </p>
                <p className="text-sm sm:text-base font-serif text-text tabular-nums mt-1 break-words">
                  {nivel.valor > 0 ? formatBRL(nivel.valor) : '—'}
                </p>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-xs font-sans mt-3 leading-relaxed">
            Soma das metas individuais configuradas se toda a equipe atingir Bronze, Prata ou Ouro.
            Não é valor de prêmio a pagar.
          </p>
        </div>
      </div>

      {comPremio.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setAberto(v => !v)}
            className="mt-4 text-sm font-sans text-primary hover:underline"
          >
            {aberto ? 'Ocultar detalhe por barbeiro' : 'Ver detalhe por barbeiro'}
          </button>

          {aberto && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm font-sans border-collapse">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wide">
                    <th className="text-left font-semibold py-2 pr-2">Barbeiro</th>
                    <th className="text-left font-semibold py-2 px-2">Já garantiu</th>
                    <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Valor</th>
                    <th className="text-left font-semibold py-2 pl-2">Pode destravar</th>
                  </tr>
                </thead>
                <tbody>
                  {comPremio.map(b => (
                    <tr key={b.barbeiroId} className="border-t border-border align-top">
                      <td className="py-2 pr-2 text-text">{b.nome}</td>
                      <td className="py-2 px-2 text-text-muted">
                        {b.metaPremio > 0 && <span>meta {b.metaTierLabel}</span>}
                        {b.metaPremio > 0 && b.campanhaPremio > 0 && <span> + </span>}
                        {b.campanhaPremio > 0 && <span>campanha</span>}
                        {b.jaGarantido === 0 && <span>—</span>}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-text">{b.jaGarantido > 0 ? formatBRL(b.jaGarantido) : '—'}</td>
                      <td className="py-2 pl-2 text-text-muted">
                        <div className="space-y-1">
                          {b.proxMetaTier && (
                            <p>+{formatBRL(b.proxMetaPremio)} (meta {b.proxMetaTierLabel}, faltam {formatBRL(b.proxMetaFalta)})</p>
                          )}
                          {b.campanhaFaltaPts > 0 && b.campanhaProxPremio > 0 && (
                            <p>+{formatBRL(b.campanhaProxPremio)} (campanha, faltam {b.campanhaFaltaPts} pts)</p>
                          )}
                          {!b.proxMetaTier && b.campanhaFaltaPts === 0 && (
                            <p className="text-green-500">tudo destravado 🔥</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
