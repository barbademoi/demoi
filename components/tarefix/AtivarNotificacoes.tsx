'use client'

import { useEffect, useRef, useState } from 'react'

type Resp = { ok: true } | { ok: false; erro: string }
type Props = {
  obterChave: () => Promise<{ ok: true; chave: string } | { ok: false; erro: string }>
  ativar: (inscricao: PushSubscriptionJSON, navegador: string) => Promise<Resp>
  desativar: (endpoint: string) => Promise<Resp>
  /** 'cartao' mostra um convite; 'linha' só uma linha discreta */
  estilo?: 'cartao' | 'linha'
  texto?: string
}

type Estado = 'carregando' | 'sem-suporte' | 'ios-instalar' | 'negado' | 'desligado' | 'ligado'

function chaveParaBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

async function registrar() {
  return navigator.serviceWorker.register('/tarefix/sw.js', { scope: '/tarefix/' })
}

/**
 * Liga/desliga as notificações push neste aparelho.
 * iPhone: só funciona com o Tarefix instalado na tela inicial (iOS 16.4+).
 */
export function AtivarNotificacoes({ obterChave, ativar, desativar, estilo = 'cartao', texto }: Props) {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // as funções podem chegar novas a cada render (closures): usamos a última via ref
  const fns = useRef({ obterChave, ativar, desativar })
  fns.current = { obterChave, ativar, desativar }

  useEffect(() => {
    verificar()
    // só ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verificar() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const instalado = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return setEstado(ios && !instalado ? 'ios-instalar' : 'sem-suporte')
    }
    if (Notification.permission === 'denied') return setEstado('negado')
    try {
      const reg = await registrar()
      const sub = await reg.pushManager.getSubscription()
      if (sub && Notification.permission === 'granted') {
        setEstado('ligado')
        // garante que a inscrição está ligada a quem está usando agora
        fns.current.ativar(sub.toJSON(), navigator.userAgent).catch(() => {})
      } else {
        setEstado('desligado')
      }
    } catch {
      setEstado('sem-suporte')
    }
  }

  async function ligar() {
    setErro(null)
    setOcupado(true)
    try {
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        setEstado(permissao === 'denied' ? 'negado' : 'desligado')
        return
      }
      const chave = await fns.current.obterChave()
      if (!chave.ok) throw new Error(chave.erro)
      const reg = await registrar()
      await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave.chave) }))
      const r = await fns.current.ativar(sub.toJSON(), navigator.userAgent)
      if (!r.ok) throw new Error(r.erro)
      setEstado('ligado')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui ativar neste aparelho.')
    } finally {
      setOcupado(false)
    }
  }

  async function desligar() {
    setErro(null)
    setOcupado(true)
    try {
      const reg = await registrar()
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fns.current.desativar(sub.endpoint)
        await sub.unsubscribe()
      }
      setEstado('desligado')
    } catch {
      setErro('Não consegui desativar. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  if (estado === 'carregando' || estado === 'sem-suporte') return null

  // Ligado: sempre só uma linha discreta (com "Desativar").
  // Estilo 'linha' desligado: linha com "Ativar"; nos outros estados, nada.
  if (estado === 'ligado' || estilo === 'linha') {
    if (estado !== 'ligado' && estado !== 'desligado') return null
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-tf-suave">
        <span>{estado === 'ligado' ? 'Notificações ativas neste aparelho.' : 'Receber avisos no celular.'}</span>
        <button type="button" disabled={ocupado} onClick={estado === 'ligado' ? desligar : ligar} className="min-h-[44px] font-bold text-tf-marca-texto underline disabled:opacity-50">
          {ocupado ? 'Aguarde…' : estado === 'ligado' ? 'Desativar' : 'Ativar'}
        </button>
        {erro && <span className="w-full font-bold text-tf-texto">{erro}</span>}
      </div>
    )
  }

  return (
    <div className="tf-cartao space-y-2 p-4">
      <p className="font-bold">Avisos no celular</p>
      {estado === 'ios-instalar' ? (
        <p className="text-sm text-tf-suave">
          No iPhone, primeiro adicione o Tarefix à tela inicial (Compartilhar → <b>Adicionar à Tela de Início</b>) e abra por lá. Aí o botão de ativar aparece.
        </p>
      ) : estado === 'negado' ? (
        <p className="text-sm text-tf-suave">As notificações estão bloqueadas neste aparelho. Libere nas configurações do navegador (ou do app) para o site e volte aqui.</p>
      ) : (
        <>
          <p className="text-sm text-tf-suave">{texto ?? 'Receba um aviso na hora de cada tarefa, mesmo com o app fechado.'}</p>
          <button type="button" className="tf-botao w-full" disabled={ocupado} onClick={ligar}>
            {ocupado ? 'Ativando…' : 'Ativar notificações'}
          </button>
        </>
      )}
      {erro && <p className="text-sm font-bold">{erro}</p>}
    </div>
  )
}
