'use client'

import { useMemo, useState } from 'react'
import { formatBRL } from '@/lib/utils'
import type {
  BarbeiroDisponivelAgenda,
  LeituraRelatorioAgenda,
  MapeamentoConfirmadoAgenda,
  MapeamentoSalvoAgenda,
  PreviewConfirmacaoAgenda,
  ResultadoConfirmacaoAgenda,
} from '@/lib/importacao-agenda/types'

type Props = {
  barbeiros: BarbeiroDisponivelAgenda[]
  mapeamentosSalvos: MapeamentoSalvoAgenda[]
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

function labelBase(base: 'faturamento' | 'comissao'): string {
  return base === 'faturamento' ? 'faturamento' : 'comissão'
}

export default function ImportarRelatorioClient({
  barbeiros,
  mapeamentosSalvos,
}: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [leitura, setLeitura] = useState<LeituraRelatorioAgenda | null>(null)
  const [mapeamentos, setMapeamentos] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewConfirmacaoAgenda | null>(null)
  const [resultado, setResultado] = useState<ResultadoConfirmacaoAgenda | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  const salvosPorNome = useMemo(
    () => new Map(mapeamentosSalvos.map(item => [item.nomeRelatorioChave, item.barbeiroId])),
    [mapeamentosSalvos],
  )
  const barbeirosPorNome = useMemo(() => {
    const mapa = new Map<string, string[]>()
    for (const barbeiro of barbeiros) {
      const chave = normalizarNome(barbeiro.nome)
      mapa.set(chave, [...(mapa.get(chave) ?? []), barbeiro.id])
    }
    return mapa
  }, [barbeiros])

  const itensMapeados = useMemo<MapeamentoConfirmadoAgenda[]>(
    () => (leitura?.profissionais ?? []).map(profissional => ({
      nomeRelatorio: profissional.nomeRelatorio,
      barbeiroId: mapeamentos[profissional.nomeRelatorio] ?? '',
    })),
    [leitura, mapeamentos],
  )
  const deParaCompleto = itensMapeados.length > 0 &&
    itensMapeados.every(item => item.barbeiroId) &&
    new Set(itensMapeados.map(item => item.barbeiroId)).size === itensMapeados.length

  function limparDepoisDaLeitura() {
    setPreview(null)
    setResultado(null)
    setConfirmado(false)
  }

  function montarFormulario(mapeamentoAtual: MapeamentoConfirmadoAgenda[]): FormData {
    if (!arquivo) throw new Error('Selecione novamente o PDF do Agenda Serviço.')
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    formData.append('mapeamentos', JSON.stringify(mapeamentoAtual))
    return formData
  }

  async function lerRelatorio() {
    if (!arquivo) {
      setErro('Selecione o PDF do Agenda Serviço.')
      return
    }

    setErro(null)
    setLeitura(null)
    limparDepoisDaLeitura()
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

      const iniciais: Record<string, string> = {}
      for (const profissional of corpo.leitura.profissionais) {
        const chave = normalizarNome(profissional.nomeRelatorio)
        const salvo = salvosPorNome.get(chave)
        const exatos = barbeirosPorNome.get(chave) ?? []
        iniciais[profissional.nomeRelatorio] = salvo ?? (exatos.length === 1 ? exatos[0] : '')
      }
      setMapeamentos(iniciais)
      setLeitura(corpo.leitura)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o relatório.')
    } finally {
      setLendo(false)
    }
  }

  async function prepararConfirmacao() {
    if (!deParaCompleto) {
      setErro('Confirme um barbeiro diferente para cada nome do relatório.')
      return
    }
    setErro(null)
    limparDepoisDaLeitura()
    setPreparando(true)
    try {
      const resposta = await fetch('/api/importacao-agenda/previsualizar', {
        method: 'POST',
        body: montarFormulario(itensMapeados),
      })
      const corpo = await resposta.json() as {
        preview?: PreviewConfirmacaoAgenda
        error?: string
      }
      if (!resposta.ok || !corpo.preview) {
        throw new Error(corpo.error ?? 'Não foi possível calcular os movimentos.')
      }
      setPreview(corpo.preview)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível calcular os movimentos.')
    } finally {
      setPreparando(false)
    }
  }

  async function confirmarImportacao() {
    if (!preview || !confirmado) return
    setErro(null)
    setGravando(true)
    try {
      const formData = montarFormulario(itensMapeados)
      formData.append('arquivoHash', preview.arquivoHash)
      formData.append('confirmado', 'true')
      const resposta = await fetch('/api/importacao-agenda/confirmar', {
        method: 'POST',
        body: formData,
      })
      const corpo = await resposta.json() as {
        resultado?: ResultadoConfirmacaoAgenda
        error?: string
      }
      if (!resposta.ok || !corpo.resultado?.ok) {
        throw new Error(corpo.error ?? 'Não foi possível confirmar a importação.')
      }
      setResultado(corpo.resultado)
      setConfirmado(false)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível confirmar a importação.')
    } finally {
      setGravando(false)
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
              setMapeamentos({})
              setErro(null)
              limparDepoisDaLeitura()
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
            <p className="mt-1 text-xs text-red-200/70">Se houve falha, nenhum dado foi gravado.</p>
          </div>
        )}
      </section>

      {leitura && (
        <section className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-xl text-text">2. Confira e case os barbeiros</h2>
                <p className="text-sm text-text-muted mt-1">
                  Período lido: <span className="text-text font-semibold">
                    {formatarData(leitura.periodoInicio)} a {formatarData(leitura.periodoFim)}
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Ainda sem gravar
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
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-surface-2 text-left text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome no relatório</th>
                  <th className="px-5 py-3 font-medium">Barbeiro no BarberMeta</th>
                  <th className="px-5 py-3 font-medium text-right">Faturamento acum.</th>
                  <th className="px-5 py-3 font-medium text-right">Comissão acum.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leitura.profissionais.map(profissional => (
                  <tr key={profissional.nomeRelatorio}>
                    <td className="px-5 py-3 text-text font-semibold">{profissional.nomeRelatorio}</td>
                    <td className="px-5 py-3">
                      <select
                        value={mapeamentos[profissional.nomeRelatorio] ?? ''}
                        onChange={event => {
                          setMapeamentos(atual => ({
                            ...atual,
                            [profissional.nomeRelatorio]: event.target.value,
                          }))
                          setErro(null)
                          limparDepoisDaLeitura()
                        }}
                        className="input min-w-[220px]"
                        aria-label={`Barbeiro correspondente a ${profissional.nomeRelatorio}`}
                      >
                        <option value="">Selecione o barbeiro</option>
                        {barbeiros.map(barbeiro => (
                          <option key={barbeiro.id} value={barbeiro.id}>
                            {barbeiro.nome}
                          </option>
                        ))}
                      </select>
                    </td>
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
                  <td className="px-5 py-3" colSpan={2}>Total conferido</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(leitura.totais.faturamentoAcumulado)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(leitura.totais.comissaoAcumulada)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t border-border p-5 sm:px-6 space-y-3">
            {!deParaCompleto && (
              <p className="text-xs text-amber-200">
                Cada nome precisa ser confirmado com um barbeiro diferente.
              </p>
            )}
            <button
              type="button"
              onClick={prepararConfirmacao}
              disabled={!deParaCompleto || preparando}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {preparando ? 'Calculando movimentos…' : 'Calcular o que será lançado'}
            </button>
            <p className="text-xs text-text-muted">
              O de-para só será salvo quando você confirmar a importação.
            </p>
          </div>
        </section>
      )}

      {preview && (
        <section className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border space-y-4">
            <div>
              <h2 className="font-serif text-xl text-text">3. Pré-visualização final</h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                Movimento do dia = acumulado de {formatarData(preview.leitura.periodoFim)}
                {' '}menos a última foto anterior. A trilha que conta para meta e ranking agora é
                {' '}<span className="font-semibold text-primary">{labelBase(preview.baseMeta)}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`rounded-xl border p-4 ${
                preview.baseMeta === 'faturamento'
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-surface-2'
              }`}>
                <p className="text-[11px] uppercase tracking-wider text-text-muted">Movimento de faturamento</p>
                <p className="font-serif text-2xl text-text mt-1">{formatBRL(preview.totaisMovimento.faturamento)}</p>
                {preview.baseMeta === 'faturamento' && <p className="text-xs text-primary mt-1">Conta na meta e no ranking</p>}
              </div>
              <div className={`rounded-xl border p-4 ${
                preview.baseMeta === 'comissao'
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-surface-2'
              }`}>
                <p className="text-[11px] uppercase tracking-wider text-text-muted">Movimento de comissão</p>
                <p className="font-serif text-2xl text-text mt-1">{formatBRL(preview.totaisMovimento.comissao)}</p>
                {preview.baseMeta === 'comissao' && <p className="text-xs text-primary mt-1">Conta na meta e no ranking</p>}
              </div>
            </div>

            {preview.avisos.map(aviso => (
              <div key={aviso} className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
                {aviso}
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-2 text-left text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Barbeiro</th>
                  <th className="px-5 py-3 font-medium text-right">Faturamento acum.</th>
                  <th className="px-5 py-3 font-medium text-right">Movimento fat.</th>
                  <th className="px-5 py-3 font-medium text-right">Comissão acum.</th>
                  <th className="px-5 py-3 font-medium text-right">Movimento comissão</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.linhas.map(linha => (
                  <tr key={linha.barbeiroId}>
                    <td className="px-5 py-3">
                      <p className="text-text font-semibold">{linha.barbeiroNome}</p>
                      <p className="text-xs text-text-muted">no PDF: {linha.nomeRelatorio}</p>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">{formatBRL(linha.faturamentoAcumulado)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {formatBRL(linha.movimentoFaturamento)}
                      <p className="text-[11px] text-text-muted">anterior {formatBRL(linha.faturamentoAnterior)}</p>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">{formatBRL(linha.comissaoAcumulada)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {formatBRL(linha.movimentoComissao)}
                      <p className="text-[11px] text-text-muted">anterior {formatBRL(linha.comissaoAnterior)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        linha.reimportacao
                          ? 'bg-amber-500/10 text-amber-200'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {linha.reimportacao ? 'Atualiza a foto' : 'Nova foto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border p-5 sm:p-6 space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={event => setConfirmado(event.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm text-text leading-relaxed">
                Conferi o período, os barbeiros e os dois valores acumulados. Quero gravar esta foto
                em <strong>{formatarData(preview.leitura.periodoFim)}</strong> e atualizar os movimentos exibidos acima.
              </span>
            </label>

            <button
              type="button"
              onClick={confirmarImportacao}
              disabled={!confirmado || gravando || preview.cicloFechado}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gravando
                ? 'Gravando com segurança…'
                : preview.reimportacao
                  ? 'Confirmar e atualizar esta data'
                  : 'Confirmar e gravar importação'}
            </button>
            <p className="text-xs text-text-muted">
              Sem marcar e clicar no botão acima, nada é gravado.
            </p>
          </div>
        </section>
      )}

      {resultado && (
        <section role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6">
          <h2 className="font-serif text-xl text-emerald-200">Importação concluída</h2>
          <p className="mt-2 text-sm text-text leading-relaxed">
            {resultado.profissionais} barbeiros atualizados na data correta,
            {' '}{formatarData(resultado.dataRelatorio)}. As duas trilhas foram guardadas e
            {' '}{resultado.reimportacao ? 'a foto existente foi substituída sem duplicar.' : 'uma nova foto diária foi criada.'}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {resultado.fotosRecalculadas} foto(s) recalculada(s). Meta e ranking usam {labelBase(resultado.baseMeta)}.
          </p>
        </section>
      )}
    </div>
  )
}
