'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFilaDePopups } from '@/lib/popups/fila'
import { deveOfertarTarefix } from '@/app/dashboard/tarefix/actions'
import TarefixApresentacao from './TarefixApresentacao'

/**
 * Popup de lançamento do Tarefix no dashboard. Aparece só para quem ainda não
 * comprou (nem pediu), no máximo 3 vezes: depois de 3, 7 e 30 dias.
 */
const STORAGE_KEY = 'barbermeta:tarefix-lancamento-v1'
const DIA = 24 * 60 * 60 * 1000

type Estado = { vezes: number; ultima: string }

function ler(): Estado | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const e = JSON.parse(raw) as Partial<Estado>
    if (!e.ultima || !Number.isFinite(e.vezes)) return null
    return { vezes: Number(e.vezes), ultima: e.ultima }
  } catch {
    return null
  }
}

function esperaDias(vezes: number) {
  if (vezes >= 3) return 30
  if (vezes === 2) return 7
  return 3
}

function prazoPassou(): boolean {
  const e = ler()
  if (!e) return true
  const t = Date.parse(e.ultima)
  return !Number.isFinite(t) || Date.now() - t >= esperaDias(e.vezes) * DIA
}

export default function TarefixLaunchModal() {
  const pathname = usePathname()
  const [quer, setQuer] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (pathname !== '/dashboard' || !prazoPassou()) return
    let cancel = false
    // só para quem ainda não tem o Tarefix (nem pedido em análise) — o servidor decide
    ;(async () => {
      try {
        if ((await deveOfertarTarefix()) && !cancel) setQuer(true)
      } catch {
        /* sem popup se não deu para conferir */
      }
    })()
    return () => {
      cancel = true
    }
  }, [pathname])

  const { minhaVez, abrir, fechar } = useFilaDePopups('tarefix-lancamento', quer)

  useEffect(() => {
    if (!minhaVez || aberto) return
    const t = window.setTimeout(() => {
      const e = ler()
      const vezes = e && e.vezes >= 3 ? 1 : Math.min((e?.vezes ?? 0) + 1, 3)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ vezes, ultima: new Date().toISOString() } satisfies Estado))
      } catch {
        /* storage bloqueado: segue só nesta visita */
      }
      setAberto(true)
      abrir()
    }, 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaVez, aberto])

  function sair() {
    setAberto(false)
    setQuer(false)
    fechar()
  }

  return (
    <TarefixApresentacao
      aberto={aberto}
      aoFechar={sair}
      rodape={
        <Link href="/dashboard/tarefix#comprar" onClick={sair} className="block w-full rounded-xl bg-[#5B3DF5] px-5 py-3.5 text-center text-sm font-black text-white hover:brightness-110">
          Quero o Tarefix por R$ 47
        </Link>
      }
    />
  )
}
