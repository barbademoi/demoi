'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { enviarMensagemColaborador } from './actions'

const MIN = 20
const MAX = 2000

export function CaixaMensagem({ slug }: { slug: string }) {
  const [texto, setTexto] = useState('')
  const [anonimo, setAnonimo] = useState(false)
  const [enviando, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const tamanho = texto.trim().length
  const podeEnviar = tamanho >= MIN && tamanho <= MAX && !enviando

  const handleSubmit = () => {
    setErro(null)
    startTransition(async () => {
      const res = await enviarMensagemColaborador({ slug, conteudo: texto, anonimo })
      if (res.ok) {
        setEnviado(true)
        setTexto('')
        setAnonimo(false)
        setTimeout(() => setEnviado(false), 4000)
      } else {
        setErro(res.erro ?? 'Falha ao enviar.')
      }
    })
  }

  return (
    <section className="pt-6 border-t border-border">
      <div className="card p-5 space-y-4 bg-linho/40">
        <div className="space-y-1.5">
          <h2 className="font-serif text-xl text-marrom leading-tight">
            Tem algo que você quer compartilhar?
          </h2>
          <p className="text-sm text-grafite leading-relaxed">
            Sua opinião conta. Pode ser sobre trabalho, equipe, processos, ou qualquer
            coisa que queira que a empresa saiba.
          </p>
        </div>

        <div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
            placeholder="Digite aqui..."
            rows={5}
            className="input text-sm w-full resize-y"
            disabled={enviando}
            maxLength={MAX}
          />
          <div className="flex items-center justify-between text-xs mt-1">
            <span
              className={
                tamanho > 0 && tamanho < MIN ? 'text-orange-600' : 'text-chumbo'
              }
            >
              {tamanho > 0 && tamanho < MIN ? `Mínimo ${MIN} caracteres` : ' '}
            </span>
            <span className="text-chumbo tabular-nums">
              {tamanho} / {MAX}
            </span>
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anonimo}
            onChange={(e) => setAnonimo(e.target.checked)}
            disabled={enviando}
            className="mt-0.5 w-4 h-4 accent-marrom cursor-pointer"
          />
          <span className="text-sm text-text">
            Enviar anonimamente
            <span className="block text-xs text-chumbo mt-0.5">
              Sua identidade não será mostrada à empresa.
            </span>
          </span>
        </label>

        {erro && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!podeEnviar}
          className="w-full py-3 rounded-md bg-marrom text-white text-sm font-semibold hover:bg-marrom/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {enviado ? (
            <>
              <Check size={16} strokeWidth={2.5} /> Enviado!
            </>
          ) : enviando ? (
            'Enviando...'
          ) : (
            'Enviar pra empresa'
          )}
        </button>
      </div>
    </section>
  )
}
