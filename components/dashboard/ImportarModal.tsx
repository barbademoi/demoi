'use client'

import { useState, useTransition } from 'react'
import { analisarRelatorio, confirmarImportacao } from '@/app/dashboard/importar/actions'
import type { BarbeiroImportado } from '@/app/dashboard/importar/actions'
import { formatBRL } from '@/lib/utils'

interface Props {
  barbeariaId: string
  mes: number
  ano: number
}

type Step = 'input' | 'preview' | 'done'

export default function ImportarModal({ barbeariaId, mes, ano }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('input')
  const [texto, setTexto] = useState('')
  const [dados, setDados] = useState<BarbeiroImportado[]>([])
  const [erros, setErros] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [isAnalyzing, startAnalyze] = useTransition()
  const [isSaving, startSave] = useTransition()

  function fechar() {
    setOpen(false)
    setTimeout(() => {
      setStep('input')
      setTexto('')
      setDados([])
      setErros([])
      setErro(null)
    }, 200)
  }

  function analisar() {
    if (!texto.trim()) return
    setErro(null)
    startAnalyze(async () => {
      try {
        const resultado = await analisarRelatorio(texto)
        setDados(resultado)
        setStep('preview')
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao analisar relatório')
      }
    })
  }

  function confirmar() {
    startSave(async () => {
      try {
        const res = await confirmarImportacao(dados, barbeariaId, mes, ano)
        setErros(res.erros)
        setStep('done')
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao salvar dados')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost text-sm py-2 px-4 border border-border flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Importar relatório
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fechar} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-xl text-text">Importar relatório</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              {step === 'input' && 'Cole o relatório abaixo — a IA extrai os dados automaticamente'}
              {step === 'preview' && `${dados.length} barbeiro(s) identificado(s) — confirme antes de salvar`}
              {step === 'done' && 'Importação concluída'}
            </p>
          </div>
          <button onClick={fechar} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Step: input */}
          {step === 'input' && (
            <>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder="Cole aqui o relatório do Agenda Serviço, planilha, ou qualquer formato de texto com os dados dos barbeiros..."
                className="input h-64 resize-none font-sans text-sm"
              />
              {erro && (
                <p className="text-red-400 text-sm font-sans bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{erro}</p>
              )}
              <div className="flex gap-3">
                <button onClick={fechar} className="btn-ghost flex-1 text-sm py-2.5">Cancelar</button>
                <button
                  onClick={analisar}
                  disabled={!texto.trim() || isAnalyzing}
                  className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Analisar com IA
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step: preview */}
          {step === 'preview' && (
            <>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <th className="text-left text-text-muted text-xs px-4 py-3 font-medium">Barbeiro</th>
                      <th className="text-right text-text-muted text-xs px-4 py-3 font-medium">Comissão</th>
                      <th className="text-right text-text-muted text-xs px-4 py-3 font-medium">Serviços</th>
                      <th className="text-right text-text-muted text-xs px-4 py-3 font-medium">Assinatura</th>
                      <th className="text-right text-text-muted text-xs px-4 py-3 font-medium">Produtos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map((d, i) => (
                      <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-2/30'}`}>
                        <td className="px-4 py-3 text-text font-medium">{d.nome}</td>
                        <td className="px-4 py-3 text-right font-serif text-text">{formatBRL(d.comissao)}</td>
                        <td className="px-4 py-3 text-right text-text-muted">{d.fat_servicos > 0 ? formatBRL(d.fat_servicos) : '—'}</td>
                        <td className="px-4 py-3 text-right text-text-muted">{d.fat_assinaturas > 0 ? formatBRL(d.fat_assinaturas) : '—'}</td>
                        <td className="px-4 py-3 text-right text-text-muted">{d.fat_produtos > 0 ? formatBRL(d.fat_produtos) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-text-muted text-xs font-sans">
                Os dados serão salvos no lançamento de {mes}/{ano}. Lançamentos existentes serão atualizados.
              </p>

              {erro && (
                <p className="text-red-400 text-sm font-sans bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{erro}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('input')} className="btn-ghost flex-1 text-sm py-2.5">← Voltar</button>
                <button
                  onClick={confirmar}
                  disabled={isSaving}
                  className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Salvando...
                    </>
                  ) : `Confirmar e salvar (${dados.length})`}
                </button>
              </div>
            </>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="font-serif text-lg text-text">Importação concluída</p>
                <p className="text-text-muted text-sm font-sans mt-1">
                  {dados.length - erros.length} de {dados.length} barbeiro(s) importado(s) com sucesso.
                </p>
              </div>

              {erros.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-left space-y-1">
                  <p className="text-yellow-400 text-xs font-sans font-semibold">Avisos:</p>
                  {erros.map((e, i) => (
                    <p key={i} className="text-yellow-400/80 text-xs font-sans">{e}</p>
                  ))}
                </div>
              )}

              <button onClick={fechar} className="btn-primary text-sm py-2.5 px-8">
                Fechar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
