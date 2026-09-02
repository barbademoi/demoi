'use client'

import { useEffect, useState, useTransition } from 'react'
import { adiarLembreteMeta } from '@/app/dashboard/metas/actions'
import type { LembreteMeta } from '@/lib/metas/lembreteServer'

interface Props {
  lembrete: LembreteMeta
}

/**
 * LEMBRETE DE CADASTRAR A META DO CICLO.
 *
 * Só é montado quando o servidor já decidiu que deve aparecer — se a meta
 * existe, o componente nem chega ao navegador.
 *
 * As duas saídas são "Cadastrar agora" e "Depois". Não há um "não mostrar
 * mais": a única coisa que faz este lembrete parar de existir é a meta ser
 * cadastrada. Um mês sem meta é o problema; dispensar o aviso para sempre
 * seria desligar o alarme e deixar o fogo.
 */
export default function LembreteMetaModal({ lembrete }: Props) {
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Espera um instante antes de aparecer. Um modal que nasce junto com a
  // página cobre o dashboard antes de o dono ter visto qualquer número, e o
  // reflexo é fechar sem ler.
  useEffect(() => {
    const t = setTimeout(() => setAberto(true), 900)
    return () => clearTimeout(t)
  }, [])

  // Esc fecha, como em qualquer diálogo. Fechar pelo Esc é "depois", não
  // "adiar": o lembrete volta no próximo carregamento.
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  if (!aberto) return null

  function cadastrarAgora() {
    setAberto(false)
    // O formulário de metas vive numa seção da própria página. Em vez de
    // duplicar o formulário aqui, o botão leva até ele e manda abrir — assim
    // existe um só lugar onde a meta é cadastrada.
    const secao = document.getElementById('secao-metas')
    secao?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.dispatchEvent(new CustomEvent('bm:abrir-metas'))
  }

  function depois() {
    startTransition(async () => {
      const res = await adiarLembreteMeta(lembrete.mes, lembrete.ano)
      // Se o adiamento não foi guardado, o aviso volta no próximo
      // carregamento. Melhor dizer isso do que fechar prometendo silêncio e
      // reaparecer sem explicação.
      if (res?.error) { setErro(res.error); return }
      setAberto(false)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lembrete-meta-titulo"
      onClick={(e) => { if (e.target === e.currentTarget) setAberto(false) }}
    >
      <div className="card w-full max-w-md space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl"
          >
            🎯
          </span>
          <div className="min-w-0">
            <h2 id="lembrete-meta-titulo" className="font-serif text-xl leading-tight text-text">
              {lembrete.titulo}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{lembrete.corpo}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs leading-relaxed text-text-muted">
          Ciclo <strong className="text-text">{lembrete.cicloLabel}</strong> ·{' '}
          {lembrete.diasRestantes === 1 ? 'resta 1 dia' : `restam ${lembrete.diasRestantes} dias`}
        </div>

        {erro && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-4 py-2.5 text-xs leading-relaxed text-amber-200">
            {erro} O aviso pode voltar na próxima vez que você abrir o painel.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button onClick={cadastrarAgora} className="btn-primary flex-1 text-sm">
            Cadastrar agora
          </button>
          <button onClick={depois} disabled={isPending} className="btn-ghost flex-1 text-sm">
            {isPending ? 'Ok…' : 'Depois'}
          </button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-text-muted/70">
          Este aviso some sozinho assim que a meta for cadastrada.
        </p>
      </div>
    </div>
  )
}
