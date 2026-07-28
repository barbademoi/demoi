'use client'

import { useMemo, useState, useTransition } from 'react'
import { confirmarImportacao, previsualizarImportacao } from './actions'
import {
  agregarLinhas,
  hashArquivo,
  lerArquivo,
  normalizarNome,
  sugerirMapeamento,
} from '@/lib/importacao/parser'
import { formatBRL } from '@/lib/utils'
import type {
  AcaoConflito,
  ArquivoLido,
  MapeamentoColunas,
  PedidoPreviewImportacao,
  PreviewImportacao,
  ResultadoAgregacao,
  ResultadoConfirmacao,
  TipoValorImportado,
} from '@/lib/importacao/types'
import type { BaseMeta, ModoMeta } from '@/lib/modoMeta'

type Etapa = 'arquivo' | 'barbeiros' | 'preview' | 'concluido'

interface Props {
  barbeiros: Array<{ id: string; nome: string }>
  modoMeta: ModoMeta
  baseMeta: BaseMeta
  cicloInicio: string
  cicloFim: string
  lotesRecentes: Array<{
    id: string
    arquivo_nome: string
    tipo_valor: TipoValorImportado
    lancamentos_aplicados: number
    lancamentos_ignorados: number
    total_aplicado: number
    confirmado_em: string
  }>
}

function formatarData(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')
}

function exibirCelula(valor: unknown): string {
  if (valor == null) return ''
  if (valor instanceof Date) return valor.toLocaleDateString('pt-BR')
  return String(valor)
}

function SelectColuna({
  label,
  value,
  colunas,
  onChange,
}: {
  label: string
  value: number
  colunas: string[]
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input py-2.5"
      >
        <option value={-1}>Selecione uma coluna</option>
        {colunas.map((coluna, i) => (
          <option key={`${coluna}-${i}`} value={i}>{coluna}</option>
        ))}
      </select>
    </label>
  )
}

export default function ImportacaoClient({
  barbeiros,
  modoMeta,
  baseMeta,
  cicloInicio,
  cicloFim,
  lotesRecentes,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>('arquivo')
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null)
  const [arquivoNome, setArquivoNome] = useState('')
  const [arquivoHash, setArquivoHash] = useState('')
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>({ barbeiro: -1, data: -1, valor: -1 })
  const [tipoValor, setTipoValor] = useState<TipoValorImportado>(baseMeta)
  const [agregacao, setAgregacao] = useState<ResultadoAgregacao | null>(null)
  const [correspondencias, setCorrespondencias] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewImportacao | null>(null)
  const [acoes, setAcoes] = useState<Record<string, AcaoConflito>>({})
  const [resultado, setResultado] = useState<ResultadoConfirmacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [isPending, startTransition] = useTransition()

  const tiposDisponiveis: TipoValorImportado[] = modoMeta === 'ambos'
    ? ['faturamento', 'comissao']
    : [modoMeta]

  const nomesSemConfirmacao = useMemo(
    () => agregacao?.nomesEncontrados.filter(nome => !correspondencias[nome]) ?? [],
    [agregacao, correspondencias],
  )

  const totalSelecionado = useMemo(() => {
    if (!preview) return 0
    return preview.linhas.reduce((s, linha) => {
      const acao = linha.conflito ? (acoes[linha.chave] ?? 'ignorar') : 'substituir'
      if (acao === 'ignorar') return s
      return s + (acao === 'somar'
        ? linha.valorExistente + linha.valorImportado
        : linha.valorImportado)
    }, 0)
  }, [preview, acoes])

  const quantidadeSelecionada = useMemo(() => {
    if (!preview) return 0
    return preview.linhas.filter(linha =>
      !linha.conflito || (acoes[linha.chave] ?? 'ignorar') !== 'ignorar',
    ).length
  }, [preview, acoes])

  function resetar() {
    setEtapa('arquivo')
    setArquivo(null)
    setArquivoNome('')
    setArquivoHash('')
    setMapeamento({ barbeiro: -1, data: -1, valor: -1 })
    setTipoValor(baseMeta)
    setAgregacao(null)
    setCorrespondencias({})
    setPreview(null)
    setAcoes({})
    setResultado(null)
    setErro(null)
  }

  async function selecionarArquivo(file: File | undefined) {
    if (!file) return
    setErro(null)
    setLendo(true)
    try {
      const [lido, hash] = await Promise.all([lerArquivo(file), hashArquivo(file)])
      setArquivo(lido)
      setArquivoNome(file.name)
      setArquivoHash(hash)
      setMapeamento(sugerirMapeamento(lido.colunas))
      setAgregacao(null)
      setPreview(null)
      setResultado(null)
      setEtapa('arquivo')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.')
      setArquivo(null)
    } finally {
      setLendo(false)
    }
  }

  function prepararBarbeiros() {
    if (!arquivo) return
    setErro(null)
    try {
      const resultadoAgregacao = agregarLinhas(arquivo, mapeamento)
      if (resultadoAgregacao.linhas.length === 0) {
        setErro('Nenhuma linha válida depois do mapeamento.')
        return
      }
      const barbeiroPorNome = new Map(barbeiros.map(b => [normalizarNome(b.nome), b.id]))
      const sugestoes: Record<string, string> = {}
      for (const nome of resultadoAgregacao.nomesEncontrados) {
        sugestoes[nome] = barbeiroPorNome.get(normalizarNome(nome)) ?? ''
      }
      setAgregacao(resultadoAgregacao)
      setCorrespondencias(sugestoes)
      setEtapa('barbeiros')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível processar as linhas.')
    }
  }

  function pedidoAtual(): PedidoPreviewImportacao | null {
    if (!arquivo || !agregacao) return null
    return {
      arquivoNome,
      arquivoHash,
      tipoValor,
      linhasArquivo: arquivo.totalLinhas,
      linhasValidas: agregacao.avisos.linhasValidas,
      linhas: agregacao.linhas.map(linha => ({
        ...linha,
        barbeiroId: correspondencias[linha.nomeArquivo] ?? '',
      })),
    }
  }

  function solicitarPreview() {
    const pedido = pedidoAtual()
    if (!pedido || nomesSemConfirmacao.length > 0) {
      setErro('Confirme todos os barbeiros antes de continuar.')
      return
    }
    setErro(null)
    startTransition(async () => {
      const resposta = await previsualizarImportacao(pedido)
      if ('error' in resposta) {
        setErro(resposta.error)
        return
      }
      setPreview(resposta)
      setAcoes(Object.fromEntries(
        resposta.linhas.filter(l => l.conflito).map(l => [l.chave, 'ignorar' as AcaoConflito]),
      ))
      setEtapa('preview')
    })
  }

  function confirmar() {
    const pedido = pedidoAtual()
    if (!pedido || !preview) return
    if (quantidadeSelecionada === 0) {
      setErro('Escolha pelo menos um lançamento para gravar.')
      return
    }
    setErro(null)
    startTransition(async () => {
      const resposta = await confirmarImportacao({
        ...pedido,
        acoes: preview.linhas
          .filter(l => l.conflito)
          .map(l => ({ chave: l.chave, acao: acoes[l.chave] ?? 'ignorar' })),
      })
      if ('error' in resposta) {
        setErro(resposta.error)
        return
      }
      setResultado(resposta)
      setEtapa('concluido')
    })
  }

  const avisosLeitura = agregacao ? [
    agregacao.avisos.linhasVazias > 0 && `${agregacao.avisos.linhasVazias} linha(s) vazia(s)`,
    agregacao.avisos.nomesVazios > 0 && `${agregacao.avisos.nomesVazios} sem barbeiro`,
    agregacao.avisos.datasInvalidas > 0 && `${agregacao.avisos.datasInvalidas} com data inválida`,
    agregacao.avisos.valoresInvalidos > 0 && `${agregacao.avisos.valoresInvalidos} com valor inválido`,
    agregacao.avisos.valoresNegativos > 0 && `${agregacao.avisos.valoresNegativos} com valor negativo`,
  ].filter(Boolean) as string[] : []

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-green-600/30 bg-green-500/[0.06] p-4">
        <p className="text-green-400 text-sm font-sans font-semibold">🔒 Pré-visualização obrigatória</p>
        <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
          Selecionar e mapear o arquivo não altera nenhum dado. O BarberMeta só grava depois do botão
          <span className="text-text font-semibold"> “Confirmar e gravar”</span> na última etapa.
        </p>
      </section>

      <div className="grid grid-cols-4 gap-2" aria-label="Etapas da importação">
        {[
          ['arquivo', '1. Arquivo'],
          ['barbeiros', '2. Barbeiros'],
          ['preview', '3. Prévia'],
          ['concluido', '4. Concluído'],
        ].map(([id, label]) => {
          const ordem = ['arquivo', 'barbeiros', 'preview', 'concluido']
          const ativo = ordem.indexOf(etapa) >= ordem.indexOf(id)
          return (
            <div key={id} className={`rounded-lg border px-2 py-2 text-center text-[10px] sm:text-xs font-sans ${
              ativo ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-text-muted'
            }`}>
              {label}
            </div>
          )
        })}
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300 text-sm font-sans">
          {erro}
        </div>
      )}

      {etapa === 'arquivo' && (
        <section className="card p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="font-serif text-xl text-text">1. Selecione o arquivo</h2>
            <p className="text-text-muted text-xs font-sans mt-1">
              CSV, Excel (.xlsx) ou PDF textual, até 15 MB. Todas as colunas identificadas serão lidas.
            </p>
          </div>

          <label className="block rounded-xl border border-dashed border-primary/40 bg-primary/[0.04] p-6 text-center cursor-pointer hover:bg-primary/[0.08] transition-colors">
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls,.pdf,application/pdf"
              className="sr-only"
              onChange={e => selecionarArquivo(e.target.files?.[0])}
              disabled={lendo}
            />
            <span className="text-2xl" aria-hidden>📄</span>
            <p className="text-text font-sans font-semibold text-sm mt-2">
              {lendo ? 'Lendo arquivo…' : arquivoNome || 'Clique para escolher'}
            </p>
            <p className="text-text-muted text-xs font-sans mt-1">O arquivo é processado no seu navegador.</p>
          </label>

          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="text-text-muted text-xs font-sans leading-relaxed">
              PDFs precisam ter texto selecionável. Relatórios escaneados como imagem ainda precisam ser
              exportados novamente como PDF textual, CSV ou Excel.
            </p>
          </div>

          {arquivo && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectColuna
                  label="Qual coluna é o barbeiro?"
                  value={mapeamento.barbeiro}
                  colunas={arquivo.colunas}
                  onChange={barbeiro => setMapeamento(m => ({ ...m, barbeiro }))}
                />
                <SelectColuna
                  label="Qual coluna é a data?"
                  value={mapeamento.data}
                  colunas={arquivo.colunas}
                  onChange={data => setMapeamento(m => ({ ...m, data }))}
                />
                <SelectColuna
                  label="Qual coluna é o valor?"
                  value={mapeamento.valor}
                  colunas={arquivo.colunas}
                  onChange={valor => setMapeamento(m => ({ ...m, valor }))}
                />
              </div>

              <div>
                <p className="label">O valor importado representa:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tiposDisponiveis.map(tipo => (
                    <label key={tipo} className={`rounded-xl border p-4 cursor-pointer ${
                      tipoValor === tipo ? 'border-primary bg-primary/10' : 'border-border bg-surface-2'
                    }`}>
                      <input
                        type="radio"
                        name="tipo-valor"
                        value={tipo}
                        checked={tipoValor === tipo}
                        onChange={() => setTipoValor(tipo)}
                        className="sr-only"
                      />
                      <p className="text-text text-sm font-sans font-semibold capitalize">{tipo}</p>
                      <p className="text-text-muted text-xs font-sans mt-1">
                        Será acumulado na coluna de {tipo} dos barbeiros.
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-text text-sm font-sans font-semibold">Amostra do arquivo</p>
                  <p className="text-text-muted text-xs font-sans">{arquivo.totalLinhas} linha(s)</p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full text-xs font-sans">
                    <thead className="bg-surface-2">
                      <tr>
                        {arquivo.colunas.map((c, i) => (
                          <th key={`${c}-${i}`} className="text-left text-text-muted font-semibold px-3 py-2 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {arquivo.linhas.slice(0, 5).map((linha, i) => (
                        <tr key={i} className="border-t border-border">
                          {arquivo.colunas.map((_, j) => (
                            <td key={j} className="text-text px-3 py-2 whitespace-nowrap max-w-56 truncate">
                              {exibirCelula(linha[j])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button type="button" onClick={prepararBarbeiros} className="btn-primary w-full sm:w-auto">
                Continuar e casar barbeiros
              </button>
            </>
          )}
        </section>
      )}

      {etapa === 'barbeiros' && agregacao && arquivo && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-serif text-xl text-text">2. Confirme os barbeiros</h2>
            <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
              Nomes iguais foram associados automaticamente. Todo nome diferente precisa da sua confirmação.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Linhas do arquivo</p>
              <p className="text-text font-serif text-xl mt-1">{arquivo.totalLinhas}</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Linhas válidas</p>
              <p className="text-text font-serif text-xl mt-1">{agregacao.avisos.linhasValidas}</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Após somar por dia</p>
              <p className="text-primary font-serif text-xl mt-1">{agregacao.linhas.length}</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Nomes diferentes</p>
              <p className="text-text font-serif text-xl mt-1">{agregacao.nomesEncontrados.length}</p>
            </div>
          </div>

          {avisosLeitura.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-amber-300 text-xs font-sans">Linhas ignoradas: {avisosLeitura.join(' · ')}.</p>
            </div>
          )}

          <div className="space-y-3">
            {agregacao.nomesEncontrados.map(nome => {
              const confirmado = correspondencias[nome]
              return (
                <div key={nome} className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border p-3 ${
                  confirmado ? 'border-green-600/30 bg-green-500/[0.04]' : 'border-amber-500/40 bg-amber-500/[0.06]'
                }`}>
                  <p className="text-text text-sm font-sans font-semibold truncate" title={nome}>{nome}</p>
                  <span className="text-text-muted text-xs text-center">=</span>
                  <select
                    value={confirmado ?? ''}
                    onChange={e => setCorrespondencias(m => ({ ...m, [nome]: e.target.value }))}
                    className="input py-2"
                  >
                    <option value="">Selecione o barbeiro</option>
                    {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => setEtapa('arquivo')} className="btn-ghost">Voltar</button>
            <button
              type="button"
              onClick={solicitarPreview}
              disabled={isPending || nomesSemConfirmacao.length > 0}
              className="btn-primary disabled:opacity-50"
            >
              {isPending ? 'Verificando conflitos…' : 'Gerar pré-visualização'}
            </button>
          </div>
        </section>
      )}

      {etapa === 'preview' && preview && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-serif text-xl text-text">3. Revise antes de gravar</h2>
            <p className="text-green-400 text-xs font-sans font-semibold mt-1">
              Nada foi gravado até agora.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Linhas válidas</p>
              <p className="text-text font-serif text-xl mt-1">{preview.resumo.linhasValidas}</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-border p-3">
              <p className="text-text-muted text-[10px] uppercase font-sans">Lançamentos</p>
              <p className="text-text font-serif text-xl mt-1">{preview.linhas.length}</p>
            </div>
            <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/30 p-3">
              <p className="text-amber-400 text-[10px] uppercase font-sans">Conflitos</p>
              <p className="text-text font-serif text-xl mt-1">{preview.resumo.conflitos}</p>
            </div>
            <div className="rounded-xl bg-primary/[0.06] border border-primary/30 p-3">
              <p className="text-primary text-[10px] uppercase font-sans">Selecionados</p>
              <p className="text-text font-serif text-xl mt-1">{quantidadeSelecionada}</p>
            </div>
          </div>

          {preview.avisos.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              {preview.avisos.map(aviso => (
                <p key={aviso} className="text-amber-300 text-xs font-sans">⚠️ {aviso}</p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-[820px] w-full text-xs font-sans">
              <thead className="bg-surface-2">
                <tr>
                  <th className="text-left text-text-muted font-semibold px-3 py-2">Barbeiro</th>
                  <th className="text-left text-text-muted font-semibold px-3 py-2">Data</th>
                  <th className="text-right text-text-muted font-semibold px-3 py-2">Arquivo</th>
                  <th className="text-right text-text-muted font-semibold px-3 py-2">Já existe</th>
                  <th className="text-left text-text-muted font-semibold px-3 py-2">Decisão</th>
                </tr>
              </thead>
              <tbody>
                {preview.linhas.map(linha => (
                  <tr key={linha.chave} className={`border-t border-border ${linha.conflito ? 'bg-amber-500/[0.05]' : ''}`}>
                    <td className="px-3 py-2.5 text-text font-semibold">{linha.barbeiroNome}</td>
                    <td className="px-3 py-2.5 text-text whitespace-nowrap">{formatarData(linha.data)}</td>
                    <td className="px-3 py-2.5 text-right text-text tabular-nums">
                      {formatBRL(linha.valorImportado)}
                      {linha.linhasOriginais > 1 && (
                        <span className="block text-[10px] text-text-muted">{linha.linhasOriginais} linhas somadas</span>
                      )}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${linha.conflito ? 'text-amber-300' : 'text-text-muted'}`}>
                      {linha.conflito ? formatBRL(linha.valorExistente) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {linha.conflito ? (
                        <select
                          value={acoes[linha.chave] ?? 'ignorar'}
                          onChange={e => setAcoes(a => ({
                            ...a,
                            [linha.chave]: e.target.value as AcaoConflito,
                          }))}
                          className="input py-1.5 text-xs min-w-32"
                        >
                          <option value="ignorar">Ignorar (seguro)</option>
                          <option value="substituir">Substituir</option>
                          <option value="somar">Somar</option>
                        </select>
                      ) : (
                        <span className="text-green-400">Novo lançamento</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-text-muted text-[10px] uppercase font-sans">Valor final nos registros selecionados</p>
              <p className="font-serif text-2xl text-text tabular-nums mt-1">{formatBRL(totalSelecionado)}</p>
            </div>
            <p className="text-text-muted text-xs font-sans sm:max-w-sm">
              Datas entre {formatarData(cicloInicio)} e {formatarData(cicloFim)}. Conflitos sem escolha permanecem ignorados.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => setEtapa('barbeiros')} className="btn-ghost">Voltar</button>
            <button
              type="button"
              onClick={confirmar}
              disabled={isPending || quantidadeSelecionada === 0 || preview.resumo.mesesFechados > 0}
              className="btn-primary disabled:opacity-50"
            >
              {isPending ? 'Gravando…' : `Confirmar e gravar ${quantidadeSelecionada} lançamento(s)`}
            </button>
          </div>
        </section>
      )}

      {etapa === 'concluido' && resultado && (
        <section className="card p-6 border border-green-600/30 bg-green-500/[0.04] space-y-5">
          <div>
            <p className="text-green-400 text-sm font-sans font-semibold">✓ Importação concluída</p>
            <h2 className="font-serif text-2xl text-text mt-1">{resultado.aplicados} lançamento(s) gravado(s)</h2>
            <p className="text-text-muted text-sm font-sans mt-1">
              {resultado.ignorados} ignorado(s) · valor final dos registros: {formatBRL(resultado.totalAplicado)}.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-text text-xs font-sans">{resultado.mensagemAuditoria}</p>
            {resultado.loteId && (
              <p className="text-text-muted text-[11px] font-sans mt-1">Lote: {resultado.loteId}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={resetar} className="btn-primary">Importar outro arquivo</button>
            <a href="/dashboard/lancamento-diario" className="btn-ghost text-center">Ver lançamentos</a>
          </div>
        </section>
      )}

      {lotesRecentes.length > 0 && etapa !== 'concluido' && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-serif text-lg text-text mb-3">Importações recentes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-xs font-sans">
              <thead>
                <tr className="text-text-muted uppercase">
                  <th className="text-left py-2 pr-3">Arquivo</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-right py-2 px-3">Aplicados</th>
                  <th className="text-right py-2 px-3">Ignorados</th>
                  <th className="text-right py-2 pl-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {lotesRecentes.map(lote => (
                  <tr key={lote.id} className="border-t border-border">
                    <td className="py-2.5 pr-3 text-text max-w-56 truncate" title={lote.arquivo_nome}>{lote.arquivo_nome}</td>
                    <td className="py-2.5 px-3 text-text-muted capitalize">{lote.tipo_valor}</td>
                    <td className="py-2.5 px-3 text-right text-text">{lote.lancamentos_aplicados}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">{lote.lancamentos_ignorados}</td>
                    <td className="py-2.5 pl-3 text-right text-text-muted whitespace-nowrap">
                      {new Date(lote.confirmado_em).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
