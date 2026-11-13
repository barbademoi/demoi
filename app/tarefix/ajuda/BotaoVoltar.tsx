'use client'

/** Volta para a tela anterior (ex.: a tela de tarefas do colaborador). */
export function BotaoVoltar() {
  return (
    <button type="button" className="tf-botao2 min-h-[44px] px-4 text-sm" onClick={() => (history.length > 1 ? history.back() : window.close())}>
      ‹ Voltar
    </button>
  )
}
