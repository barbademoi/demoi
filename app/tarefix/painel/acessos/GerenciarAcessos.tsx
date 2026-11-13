'use client'

import { useEffect, useState, useTransition } from 'react'
import type { EmpresaAcesso, ResultadoConcessao } from '@/lib/tarefix/acessos'
import { Erro, Interruptor, Modal, Vazio, useAcao, useAviso } from '@/components/tarefix/ui'
import { concederAcessoAcao, definirAcessoAtivo } from './acoes'

const dataBR = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))

export function GerenciarAcessos({ lista }: { lista: EmpresaAcesso[] }) {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', empresa: '' })
  const [resultado, setResultado] = useState<Extract<ResultadoConcessao, { ok: true }> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const [origem, setOrigem] = useState('')
  const status = useAcao()
  const aviso = useAviso()
  useEffect(() => setOrigem(window.location.origin), [])

  const linkEntrar = `${origem}/tarefix/entrar`
  const textoWhats = resultado
    ? `Oi! Liberei o seu acesso ao Tarefix (checklist diário da equipe).\n\nEntre em: ${linkEntrar}\nE-mail: ${resultado.email}\n${
        resultado.senha ? `Senha provisória: ${resultado.senha}\n\nDepois de entrar, troque a senha em Ajustes → Conta.` : 'Senha: a mesma que você já usa no BarberMeta.'
      }`
    : ''

  function abrir() {
    setForm({ nome: '', email: '', empresa: '' })
    setResultado(null)
    setErro(null)
    setAberto(true)
  }

  async function copiar(t: string) {
    try {
      await navigator.clipboard.writeText(t)
      aviso.mostrar('Copiado')
    } catch {
      prompt('Copie:', t)
    }
  }

  return (
    <div className="space-y-5">
      <button type="button" className="tf-botao w-full sm:w-auto" onClick={abrir}>
        + Conceder acesso
      </button>

      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma empresa ainda" />
      ) : (
        <ul className="tf-cartao divide-y divide-tf-borda">
          {lista.map((e) => (
            <li key={e.id} className={`px-5 py-4 ${e.ativo ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold">
                    {e.nome}
                    {e.minha && <span className="ml-2 rounded-full bg-tf-marca-clara px-2 py-0.5 text-xs font-bold text-tf-marca-texto">sua</span>}
                    {!e.ativo && <span className="ml-2 rounded-full bg-tf-texto px-2 py-0.5 text-xs font-bold text-tf-fundo">suspensa</span>}
                  </p>
                  <p className="truncate text-sm text-tf-suave">
                    {e.dono ? `${e.dono.nome} · ${e.dono.email}` : 'sem dono'}
                  </p>
                  <p className="text-xs text-tf-suave">
                    desde {dataBR(e.criado_em)} · {e.colaboradores} colaborador{e.colaboradores === 1 ? '' : 'es'}
                  </p>
                </div>
              </div>
              {!e.minha && (
                <div className="mt-2">
                  <Interruptor
                    rotulo="Acesso liberado"
                    descricao={e.ativo ? 'Desligar suspende o dono e os links da equipe dele. Os dados ficam guardados.' : 'Ligar libera de novo.'}
                    ligado={e.ativo}
                    desabilitado={status.pendente}
                    aoMudar={(v) => {
                      if (!v && !confirm(`Suspender o acesso de ${e.nome}?`)) return
                      status.rodar(() => definirAcessoAtivo(e.id, v), () => aviso.mostrar(v ? 'Acesso reativado' : 'Acesso suspenso'))
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Erro texto={status.erro} />

      <Modal aberto={aberto} aoFechar={() => !pendente && setAberto(false)} titulo={resultado ? 'Acesso liberado' : 'Conceder acesso'}>
        {resultado ? (
          <div className="space-y-4">
            <p>
              <b>{resultado.empresa}</b> já pode usar o Tarefix.
            </p>
            <div className="space-y-1 rounded-2xl bg-tf-fundo p-4 text-sm">
              <p>
                <span className="text-tf-suave">Link:</span> <b className="break-all">{linkEntrar}</b>
              </p>
              <p>
                <span className="text-tf-suave">E-mail:</span> <b>{resultado.email}</b>
              </p>
              {resultado.senha ? (
                <p>
                  <span className="text-tf-suave">Senha provisória:</span> <b className="font-mono text-base">{resultado.senha}</b>
                </p>
              ) : (
                <p className="text-tf-suave">Esse e-mail já tinha conta (BarberMeta): a senha é a mesma de sempre.</p>
              )}
            </div>
            {resultado.senha && <p className="text-sm text-tf-suave">Anote ou envie agora: a senha provisória não aparece de novo.</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="tf-botao" onClick={() => copiar(textoWhats)}>
                Copiar mensagem
              </button>
              <a className="tf-botao2" href={`https://wa.me/?text=${encodeURIComponent(textoWhats)}`} target="_blank" rel="noreferrer">
                Enviar no WhatsApp
              </a>
            </div>
            <button type="button" className="tf-botao2 w-full" onClick={() => setAberto(false)}>
              Fechar
            </button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              setErro(null)
              iniciar(async () => {
                const r = await concederAcessoAcao(form)
                if (r.ok) setResultado(r)
                else setErro(r.erro)
              })
            }}
          >
            <div>
              <label className="tf-rotulo" htmlFor="ac-nome">Nome do mentorado</label>
              <input id="ac-nome" className="tf-campo" autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="ac-email">E-mail (para entrar)</label>
              <input id="ac-email" type="email" className="tf-campo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <p className="mt-1 text-sm text-tf-suave">Se já tiver conta no BarberMeta, ele entra com a mesma senha.</p>
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="ac-empresa">Nome da empresa</label>
              <input id="ac-empresa" className="tf-campo" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Ex.: Barbearia do João" />
            </div>
            <Erro texto={erro} />
            <button type="submit" className="tf-botao w-full" disabled={pendente || !form.nome.trim() || !form.email.trim() || !form.empresa.trim()}>
              {pendente ? 'Liberando…' : 'Liberar acesso'}
            </button>
          </form>
        )}
      </Modal>
      {aviso.elemento}
    </div>
  )
}
