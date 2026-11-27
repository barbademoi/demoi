'use client'

import { useState } from 'react'
import TarefixApresentacao from '@/components/tarefixModulo/TarefixApresentacao'

/** Abre a apresentação passo a passo do Tarefix. */
export default function BotaoComoFunciona({ className, texto = 'Ver como funciona' }: { className?: string; texto?: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className={className}>
        {texto}
      </button>
      <TarefixApresentacao
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        rodape={
          <a href="#comprar" onClick={() => setAberto(false)} className="block w-full rounded-xl bg-[#5B3DF5] px-5 py-3.5 text-center text-sm font-black text-white hover:brightness-110">
            Quero o Tarefix por R$ 47
          </a>
        }
      />
    </>
  )
}
