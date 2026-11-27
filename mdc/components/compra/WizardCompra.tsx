'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { mascaraWhatsapp } from '@/lib/format'
import { PLANOS } from '@/lib/planos'
import { criarConta } from '@/app/comprar/actions'

export default function WizardCompra({ planoInicial }: { planoInicial: string }) {
  const router = useRouter()
  const [etapa, setEtapa] = useState(planoInicial ? 2 : 1)
  const [plano, setPlano] = useState(planoInicial)
  const [whats, setWhats] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [jaExiste, setJaExiste] = useState(false)
  const [pendente, iniciar] = useTransition()
  const escolhido = PLANOS.find((p) => p.id === plano)

  function enviar(fd: FormData) {
    setMensagem('')
    setJaExiste(false)
    fd.set('plano', plano)
    iniciar(async () => {
      const r = await criarConta(fd)
      if (r.ok) {
        router.push('/comprar/pagamento')
        router.refresh()
        return
      }
      setErros(r.erros)
      setMensagem(r.mensagem ?? 'Confere os campos marcados.')
      setJaExiste(!!r.jaExiste)
    })
  }

  return (
    <div className="pt-8">
      <Passos atual={etapa} />

      {etapa === 1 && (
        <section>
          <h1 className="mb-6 text-3xl font-black">Escolha seu plano</h1>
          <div className="space-y-3">
            {PLANOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlano(p.id)
                  setEtapa(2)
                }}
                className={`card block w-full p-5 text-left transition hover:border-latao ${plano === p.id ? 'border-latao' : ''}`}
              >
                <span className="block text-lg font-bold">{p.nome}</span>
                <span className="mt-1 block text-2xl font-black">{p.destaque}</span>
                <span className="mt-1 block text-suave">{p.detalhe}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {etapa === 2 && escolhido && (
        <section>
          <div className="card mb-6 flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-suave">Plano escolhido</p>
              <p className="font-bold">{escolhido.nome} · {escolhido.destaque}</p>
            </div>
            <button type="button" onClick={() => setEtapa(1)} className="btn-sm border border-linha">Trocar</button>
          </div>

          <h1 className="mb-2 text-3xl font-black">Crie sua conta</h1>
          <p className="mb-6 text-suave">É com ela que você vai entrar na área do membro.</p>

          <form action={enviar} className="space-y-5" noValidate>
            <Campo id="nome" rotulo="Nome completo" erro={erros.nome}>
              <input id="nome" name="nome" className="campo" autoComplete="name" required />
            </Campo>
            <Campo id="email" rotulo="E-mail" erro={erros.email}>
              <input id="email" name="email" type="email" className="campo" autoComplete="email" autoCapitalize="none" required />
            </Campo>
            <Campo id="senha" rotulo="Senha" erro={erros.senha} ajuda="Pelo menos 8 caracteres.">
              <input id="senha" name="senha" type="password" className="campo" autoComplete="new-password" minLength={8} required />
            </Campo>
            <Campo id="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
              <input
                id="whatsapp"
                name="whatsapp"
                className="campo"
                inputMode="numeric"
                placeholder="(35) 99999-9999"
                value={whats}
                onChange={(e) => setWhats(mascaraWhatsapp(e.target.value))}
                required
              />
            </Campo>

            <div>
              <label className="flex cursor-pointer items-start gap-3 text-base">
                <input type="checkbox" name="aceite" className="mt-1 h-6 w-6 shrink-0 accent-[#D9A441]" required />
                <span>
                  Li e aceito o{' '}
                  <Link href="/termo" target="_blank" className="font-semibold text-latao underline underline-offset-4">
                    termo de adesão
                  </Link>{' '}
                  da mentoria MDC.
                </span>
              </label>
              {erros.aceite && <p className="erro">{erros.aceite}</p>}
            </div>

            {mensagem && (
              <div className="rounded-xl bg-perigo/10 p-4 text-perigo">
                {mensagem}
                {jaExiste && (
                  <Link href="/entrar?next=/comprar/pagamento" className="mt-2 block font-bold underline">
                    Entrar com esse e-mail
                  </Link>
                )}
              </div>
            )}

            <button className="btn-primario w-full sm:w-full" disabled={pendente}>
              {pendente ? 'Criando conta...' : 'Continuar para o pagamento'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function Campo({ id, rotulo, erro, ajuda, children }: { id: string; rotulo: string; erro?: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="rotulo">{rotulo}</label>
      {children}
      {ajuda && !erro && <p className="ajuda">{ajuda}</p>}
      {erro && <p className="erro">{erro}</p>}
    </div>
  )
}

export function Passos({ atual }: { atual: number }) {
  const nomes = ['Plano', 'Conta', 'Pagamento']
  return (
    <ol className="mb-8 flex gap-2">
      {nomes.map((n, i) => (
        <li key={n} className="flex-1">
          <div className={`h-1.5 rounded-full ${i + 1 <= atual ? 'bg-latao' : 'bg-linha'}`} />
          <p className={`mt-1.5 text-xs font-semibold ${i + 1 === atual ? 'text-texto' : 'text-suave'}`}>{n}</p>
        </li>
      ))}
    </ol>
  )
}
