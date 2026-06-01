'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, X } from 'lucide-react'

const STORAGE_KEY = 'bussola.card-tutoriais-dispensado'

export default function CardAprendaBussola() {
  const [escondido, setEscondido] = useState(true)

  useEffect(() => {
    const dispensado = typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1'
    setEscondido(dispensado)
  }, [])

  function dispensar() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setEscondido(true)
  }

  if (escondido) return null

  return (
    <div className="rounded-lg border border-border bg-linho/60 p-4 flex items-start gap-3 animate-fade-in">
      <BookOpen size={22} strokeWidth={1.5} color="#8B6F47" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text">Aprenda a usar a Bússola</p>
        <p className="text-sm text-chumbo mt-0.5">
          Você ainda não viu todos os tutoriais básicos. Vale conhecer pra aproveitar melhor.
        </p>
        <Link href="/painel/tutoriais" className="btn-secondary mt-3 text-sm">
          Ver tutoriais
        </Link>
      </div>
      <button
        type="button"
        onClick={dispensar}
        aria-label="Dispensar"
        className="text-chumbo hover:text-text shrink-0"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  )
}
