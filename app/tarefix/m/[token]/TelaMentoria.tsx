'use client'

import { useRef, useState } from 'react'
import type { EstadoMentoria } from '@/lib/tarefix/mentoria'
import { textoPrazo } from '@/lib/tarefix/mentoriaTexto'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { comprimirImagem } from '@/lib/tarefix/imagem'
import { Erro, Modal } from '@/components/tarefix/ui'
import { Logo } from '@/components/tarefix/Logo'
import { BotaoTema } from '@/components/tarefix/Tema'
import { BotaoAtualizar } from '@/components/tarefix/BotaoAtualizar'
import { DicaInstalar } from '@/components/tarefix/DicaInstalar'
import { AtivarNotificacoes } from '@/components/tarefix/AtivarNotificacoes'
import { ativarPushMentoria, chavePushMentoria, desativarPushMentoria, entregarMissao, prepararUploadMentoria, recarregarMentoria } from './acoes'

type Entrega = EstadoMentoria['entregas'][number]

const quandoBR = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

function faltaPara(iso: string) {
  const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (min <= 0 && min > -120) return 'acontecendo agora'
  if (min < 60) return `em ${min} min`
  if (min < 24 * 60) return `em ${Math.round(min / 60)}h`
  const d = Math.round(min / (24 * 60))
  return d === 1 ? 'amanhã' : `em ${d} dias`
}

export function TelaMentoria({ token, nome, inicial, hoje }: { token: string; nome: string; inicial: EstadoMentoria; hoje: string }) {
  const [estado, setEstado] = useState(inicial)
  const [entregando, setEntregando] = useState<Entrega | null>(null)
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [verConcluidas, setVerConcluidas] = useState(false)
  const camera = useRef<HTMLInputElement>(null)
  const primeiro = nome.split(' ')[0]

  const e = estado.entregas
  const grupos: { titulo: string; itens: Entrega[]; tom: 'forte' | 'marca' | 'normal' }[] = [
    { titulo: 'Atrasadas', itens: e.filter((x) => x.situacao === 'atrasada'), tom: 'forte' },
    { titulo: 'Para refazer', itens: e.filter((x) => x.situacao === 'devolvida'), tom: 'forte' },
    { titulo: 'Para hoje', itens: e.filter((x) => x.situacao === 'hoje'), tom: 'marca' },
    { titulo: 'Próximas', itens: e.filter((x) => x.situacao === 'proxima'), tom: 'normal' },
    { titulo: 'Esperando o mentor aprovar', itens: e.filter((x) => x.situacao === 'aguardando'), tom: 'normal' },
  ]
  const concluidas = e.filter((x) => x.situacao === 'concluida').reverse()
  const pendentes = grupos.slice(0, 4).reduce((n, g) => n + g.itens.length, 0)

  function abrir(x: Entrega) {
    setErro(null)
    setTexto(x.situacao === 'devolvida' ? x.texto ?? '' : '')
    setFoto(null)
    setEntregando(x)
  }

  async function enviar() {
    if (!entregando) return
    setErro(null)
    setEnviando(true)
    try {
      let caminho: string | undefined
      if (entregando.prova === 'foto') {
        if (!foto) throw new Error('Tire ou escolha a foto primeiro.')
        const blob = await comprimirImagem(foto, 1600, 0.75)
        const prep = await prepararUploadMentoria(token)
        if (!prep.ok) throw new Error(prep.erro)
        const { error } = await createTarefixClient().storage.from('tarefix-provas').uploadToSignedUrl(prep.caminho, prep.tokenUpload, blob, { contentType: 'image/jpeg' })
        if (error) throw new Error('Não consegui enviar a foto. Confira a internet e tente de novo.')
        caminho = prep.caminho
      }
      const r = await entregarMissao(token, entregando.id, { texto, foto: caminho })
      if (r.estado) setEstado(r.estado)
      if (!r.ok) throw new Error(r.erro)
      setEntregando(null)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Sem conexão. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
      <header className="flex items-center gap-3">
        <Logo className="text-3xl" />
        <div className="flex-1" />
        <BotaoAtualizar
          intervaloSeg={180}
          aoAtualizar={async () => {
            const r = await recarregarMentoria(token)
            if (r.estado) setEstado(r.estado)
            else if (!r.ok) setErro(r.erro)
          }}
        />
        <BotaoTema />
      </header>

      <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight">
        {pendentes ? `${primeiro}, você tem ${pendentes} ${pendentes > 1 ? 'missões' : 'missão'} em aberto` : `Tudo em dia, ${primeiro}! 💪`}
      </h1>
      <p className="mt-1 text-tf-suave">Mentoria com {estado.mentor}. Entregue no prazo: é aqui que o resultado aparece.</p>

      <DicaInstalar />
      <div className="mt-4">
        <AtivarNotificacoes
          obterChave={() => chavePushMentoria(token)}
          ativar={(s, n) => ativarPushMentoria(token, s, n)}
          desativar={(x) => desativarPushMentoria(token, x)}
          texto="Receba lembrete 2 dias antes de cada prazo, no dia, e antes da reunião, mesmo com o app fechado."
        />
      </div>

      {/* reunião */}
      <section className="mt-4 rounded-2xl bg-tf-marca p-5 text-white">
        <p className="text-sm font-extrabold uppercase tracking-wide text-white/80">Próxima reunião</p>
        {estado.reuniao ? (
          <>
            <p className="mt-1 text-xl font-extrabold first-letter:uppercase">{quandoBR(estado.reuniao.quando)}</p>
            <p className="text-sm text-white/85">{faltaPara(estado.reuniao.quando)}</p>
            {estado.reuniao.link && (
              <a href={estado.reuniao.link} target="_blank" rel="noreferrer" className="mt-3 flex min-h-[48px] items-center justify-center rounded-2xl bg-white font-extrabold text-tf-marca">
                Entrar na reunião
              </a>
            )}
          </>
        ) : (
          <p className="mt-1 font-bold">Ainda não marcada. {estado.mentor} vai marcar e você recebe aqui.</p>
        )}
      </section>

      <div className="mt-4">
        <Erro texto={!entregando ? erro : null} />
      </div>

      {grupos.map(
        (g) =>
          g.itens.length > 0 && (
            <section key={g.titulo} className="mt-6">
              <h2 className="mb-2 text-lg font-extrabold">
                {g.titulo} <span className="text-tf-suave">({g.itens.length})</span>
              </h2>
              <ul className="space-y-3">
                {g.itens.map((x) => (
                  <li key={x.id} className={`tf-cartao p-4 ${g.tom === 'forte' ? '!border-2 !border-tf-texto' : g.tom === 'marca' ? '!border-2 !border-tf-marca' : ''}`}>
                    <p className="text-lg font-extrabold leading-snug">{x.titulo}</p>
                    <p className={`mt-0.5 text-sm font-bold ${x.situacao === 'atrasada' ? 'text-tf-texto' : 'text-tf-suave'}`}>
                      {x.situacao === 'aguardando' ? 'Entregue. Esperando aprovação.' : textoPrazo(x, hoje)}
                      {x.prova !== 'nenhuma' && x.situacao !== 'aguardando' && ` · enviar ${x.prova === 'foto' ? 'foto ou print' : 'texto'}`}
                    </p>
                    {x.descricao && <p className="mt-2 whitespace-pre-line text-sm text-tf-suave">{x.descricao}</p>}
                    {x.situacao === 'devolvida' && x.motivo && (
                      <p className="mt-2 rounded-xl bg-tf-texto px-3 py-2 text-sm font-bold text-tf-fundo">
                        {estado.mentor} pediu ajuste: “{x.motivo}”
                      </p>
                    )}
                    {x.situacao !== 'aguardando' && (
                      <button type="button" className="tf-botao mt-3 w-full" onClick={() => abrir(x)}>
                        {x.situacao === 'devolvida' ? 'Refazer e entregar' : 'Entregar'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
      )}

      {e.length === 0 && <div className="tf-cartao mt-6 px-5 py-10 text-center text-tf-suave">Nenhuma missão ainda. Quando {estado.mentor} criar, aparece aqui.</div>}

      {concluidas.length > 0 && (
        <section className="mt-6">
          <button type="button" className="text-lg font-extrabold" onClick={() => setVerConcluidas((v) => !v)} aria-expanded={verConcluidas}>
            ✓ Concluídas <span className="text-tf-suave">({concluidas.length})</span> {verConcluidas ? '−' : '+'}
          </button>
          {verConcluidas && (
            <ul className="tf-cartao mt-2 divide-y divide-tf-borda">
              {concluidas.slice(0, 30).map((x) => (
                <li key={x.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="text-tf-marca-texto">✓</span>
                  <span className="min-w-0 flex-1 truncate">{x.titulo}</span>
                  <span className="shrink-0 text-tf-suave">{x.prazo.split('-').reverse().slice(0, 2).join('/')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal aberto={entregando !== null} aoFechar={() => !enviando && setEntregando(null)} titulo="Entregar missão">
        {entregando && (
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              enviar()
            }}
          >
            <p className="text-lg font-extrabold">{entregando.titulo}</p>
            {entregando.prova === 'texto' && (
              <div>
                <label className="tf-rotulo" htmlFor="en-texto">Sua resposta</label>
                <textarea id="en-texto" className="tf-campo min-h-[140px] py-3" autoFocus maxLength={2000} value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Conte o que fez, o resultado, o que aprendeu…" />
              </div>
            )}
            {entregando.prova === 'foto' && (
              <div className="space-y-2">
                <button type="button" className="tf-botao2 w-full" onClick={() => camera.current?.click()}>
                  {foto ? 'Trocar foto' : '📷 Tirar foto ou escolher print'}
                </button>
                {foto && <p className="text-sm font-bold text-tf-marca-texto">Foto pronta para enviar: {foto.name}</p>}
                <input
                  ref={camera}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(ev) => {
                    const f = ev.target.files?.[0]
                    ev.target.value = ''
                    if (f) setFoto(f)
                  }}
                />
              </div>
            )}
            {entregando.prova === 'nenhuma' && <p className="text-tf-suave">Confirme que você fez esta missão.</p>}
            {entregando.aprovacao && <p className="text-sm text-tf-suave">{estado.mentor} vai conferir e aprovar.</p>}
            <Erro texto={erro} />
            <button type="submit" className="tf-botao w-full" disabled={enviando || (entregando.prova === 'texto' && !texto.trim()) || (entregando.prova === 'foto' && !foto)}>
              {enviando ? 'Enviando…' : 'Entregar'}
            </button>
          </form>
        )}
      </Modal>
    </main>
  )
}
