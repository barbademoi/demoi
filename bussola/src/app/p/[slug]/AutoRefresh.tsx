'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Atualização silenciosa: revalida a página periodicamente para trazer novos
// elogios. (Realtime do Supabase não é usado aqui porque exigiria expor a
// tabela de feedbacks ao acesso anônimo via RLS, o que vazaria dados.)
export default function AutoRefresh({ intervalo = 60000 }: { intervalo?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalo)
    return () => clearInterval(id)
  }, [router, intervalo])
  return null
}
