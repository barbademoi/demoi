'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Faz polling do servidor e avisa quando chega um novo elogio.
// `elogiosTotal` é o total de feedbacks positivos; quando aumenta entre
// atualizações, mostramos o toast comemorativo.
export default function AtualizacaoAuto({ elogiosTotal }: { elogiosTotal: number }) {
  const router = useRouter()
  const anterior = useRef(elogiosTotal)
  const [toast, setToast] = useState(false)

  // Polling a cada 60s.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60000)
    return () => clearInterval(id)
  }, [router])

  // Detecta novo elogio após refresh.
  useEffect(() => {
    if (elogiosTotal > anterior.current) {
      setToast(true)
      const t = setTimeout(() => setToast(false), 4000)
      anterior.current = elogiosTotal
      return () => clearTimeout(t)
    }
    anterior.current = elogiosTotal
  }, [elogiosTotal])

  if (!toast) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
      Você recebeu um novo elogio! 🎉
    </div>
  )
}
