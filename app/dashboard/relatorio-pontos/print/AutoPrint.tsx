'use client'

import { useEffect } from 'react'

// Dispara o diálogo de impressão assim que o relatório monta. O usuário
// escolhe "Salvar como PDF". Fecha a aba após imprimir/cancelar.
export default function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])
  return null
}
