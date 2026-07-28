'use client'

import { useState } from 'react'
import { formatBRL } from '@/lib/utils'
import type { LeituraRelatorioAgenda } from '@/lib/importacao-agenda/types'

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function ImportarRelatorioClient() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [leitura, setLeitura] = useState<LeituraRelatorioAgenda | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)

  async function lerRelatorio() {
    if (!arquivo) {
      setErro('Selecione o PDF do Agenda Serviço.')
      return
    }

    setErro(null)
    setLeitura(null)
    setLendo(true)
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      const resposta = await fetch('/api/importacao-agenda/leitura', {
        method: 'POST',
        body: formData,
      })
      const corpo = await resposta.json() as {
        leitura?: LeituraRelatorioAgenda
        error?: string
      }
      if (!resposta.ok || !corpo.leitura) {
        throw new Error(corpo.error ?? 'Não foi possível ler o relatório.')
      }
      setLeitura(corpo.leitura)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o relatório.')
    } finally {
      setLendo(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl text-text">1. Selecione o relatório</h2>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Use o PDF “Relatório de faturamento total” exportado pelo Agenda Serviço.
            Apenas a página 1 será lida.
          </p>
        </div>

        <label className="block">
          <span className="label">Arquivo PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={event => {
              setArquivo(event.target.files?.[0] ?? null)
              setLeitura(null)
              setErro(null)
            }}
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
          />
        </label>

        <button
          type="button"
          onClick={lerRelatorio}
          disabled={!arquivo || lendo}
          className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {lendo ? 'Lendo página 1…' : 'Ler e mostrar pré-visualização'}
        </button>

        {erro && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {erro}
            <p className="mt-1 text-xs text-red-200/70">Nenhum dado foi gravado.</p>
          </div>
        )}
      </section>

      {leitura && (
        <section className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-xl text-text">Pré-visualização da leitura</h2>
                <p className="text-sm text-text-muted mt-1">
                  Período lido: <span className="text-text font-semibold">
                    {formatarData(leitura.periodoInicio)} a {formatarData(leitura.periodoFim)}
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Somente leitura
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">Faturamento acumulado</p>
                <p className="font-serif text-2xl text-text mt-1">{formatBRL(leitura.totais.faturamentoAcumulado)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">Comissão acumulada</p>
                <p className="font-serif text-2xl text-text mt-1">{formatBRL(leitura.totais.comissaoAcumulada)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="bg-surface-2 text-left text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Barbeiro no relatório</th>
                  <th className="px-5 py-3 font-medium text-right">Faturamento acum.</th>
                  <th className="px-5 py-3 font-medium text-right">Comissão acum.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leitura.profissionais.map(profissional => (
                  <tr key={profissional.nomeRelatorio}>
                    <td className="px-5 py-3 text-text font-semibold">{profissional.nomeRelatorio}</td>
                    <td className="px-5 py-3 text-text text-right tabular-nums">
                      {formatBRL(profissional.faturamentoAcumulado)}
                    </td>
                    <td className="px-5 py-3 text-text text-right tabular-nums">
                      {formatBRL(profissional.comissaoAcumulada)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-surface-2 font-semibold text-text">
                <tr>
                  <td className="px-5 py-3">Total conferido</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(leitura.totais.faturamentoAcumulado)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(leitura.totais.comissaoAcumulada)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t border-amber-500/20 bg-amber-500/5 p-5 sm:px-6">
            <p className="text-sm font-semibold text-amber-200">Nenhum dado foi gravado.</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Esta etapa serve apenas para você conferir a leitura. O de-para e a confirmação de gravação serão adicionados na próxima etapa.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
