'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { Aviso } from '@/lib/tarefix/tipos'
import { FUSO } from '@/lib/tarefix/datas'
import { marcarAvisosLidos } from '../acoesHoje'

const ICONES: Record<Aviso['tipo'], string> = {
  fechamento_dia: 'M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  foto_enviada: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  extra_nova: 'M12 5v14M5 12h14',
  geral: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
}

const quando = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  const marcou = useRef(false)
  useEffect(() => {
    // abriu a lista → todos lidos (o destaque de "novo" continua até sair da página)
    if (marcou.current || !avisos.some((a) => !a.lido)) return
    marcou.current = true
    marcarAvisosLidos()
  }, [avisos])

  return (
    <ul className="tf-cartao divide-y divide-tf-borda">
      {avisos.map((a) => {
        const conteudo = (
          <>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.lido ? 'bg-tf-fundo text-tf-suave' : 'bg-tf-marca-clara text-tf-marca-texto'}`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={ICONES[a.tipo] ?? ICONES.geral} />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block ${a.lido ? '' : 'font-bold'}`}>{a.texto}</span>
              <span className="block text-sm text-tf-suave">{quando(a.criado_em)}</span>
            </span>
            {!a.lido && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-tf-marca" aria-label="novo" />}
          </>
        )
        return (
          <li key={a.id}>
            {a.link ? (
              <Link href={a.link} className="flex min-h-[64px] items-center gap-4 px-5 py-3 hover:bg-tf-marca-clara/50">
                {conteudo}
              </Link>
            ) : (
              <div className="flex min-h-[64px] items-center gap-4 px-5 py-3">{conteudo}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
