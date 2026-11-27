'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Escolha from '@/components/Escolha'
import { mascaraWhatsapp } from '@/lib/format'
import { DISPOSICAO, DOR, FATURAMENTO, ORIGEM, PERFIL, UFS } from '@/lib/opcoes'
import { entrarNaLista } from './actions'

export default function FormularioLista({ botao }: { botao: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [whats, setWhats] = useState('')
  const [perfil, setPerfil] = useState('')
  const [disposicao, setDisposicao] = useState('')
  const [faturamento, setFaturamento] = useState('')
  const [dor, setDor] = useState('')
  const [origem, setOrigem] = useState('')
  const [utm, setUtm] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Guarda de onde a pessoa veio (link do Instagram, anúncio...).
    const p = new URLSearchParams(window.location.search)
    const o: Record<string, string> = {}
    p.forEach((v, k) => {
      if (k.startsWith('utm_')) o[k] = v
    })
    if (Object.keys(o).length) setUtm(JSON.stringify(o))
  }, [])

  function enviar(fd: FormData) {
    setMensagem('')
    iniciar(async () => {
      const r = await entrarNaLista(fd)
      if (r.ok) {
        router.push('/pronto')
        return
      }
      setErros(r.erros)
      setMensagem(r.mensagem ?? 'Confere os campos marcados em vermelho.')
      const primeiro = Object.keys(r.erros)[0]
      if (primeiro) {
        formRef.current?.querySelector(`[data-campo="${primeiro}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  const E = ({ k }: { k: string }) => (erros[k] ? <p className="erro">{erros[k]}</p> : null)

  return (
    <form ref={formRef} action={enviar} className="space-y-7" noValidate>
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="utm" value={utm} />

      <div data-campo="nome">
        <label htmlFor="nome" className="rotulo">Nome *</label>
        <input id="nome" name="nome" className="campo" autoComplete="name" placeholder="Seu nome" required />
        <E k="nome" />
      </div>

      <div data-campo="whatsapp">
        <label htmlFor="whatsapp" className="rotulo">WhatsApp *</label>
        <input
          id="whatsapp"
          name="whatsapp"
          className="campo"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(35) 99999-9999"
          value={whats}
          onChange={(e) => setWhats(mascaraWhatsapp(e.target.value))}
          required
        />
        <E k="whatsapp" />
      </div>

      <div className="grid grid-cols-[1fr_96px] gap-3" data-campo="cidade">
        <div>
          <label htmlFor="cidade" className="rotulo">Cidade *</label>
          <input id="cidade" name="cidade" className="campo" autoComplete="address-level2" placeholder="Sua cidade" required />
          <E k="cidade" />
        </div>
        <div data-campo="uf">
          <label htmlFor="uf" className="rotulo">Estado *</label>
          <select id="uf" name="uf" className="campo px-3" defaultValue="" required>
            <option value="" disabled>UF</option>
            {UFS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <E k="uf" />
        </div>
      </div>

      <div data-campo="perfil">
        <p className="rotulo">Você trabalha sozinho ou com equipe? *</p>
        <Escolha nome="perfil" opcoes={PERFIL} valor={perfil} onChange={(v) => setPerfil(v as string)} colunas={2} />
        <E k="perfil" />
      </div>

      <div data-campo="disposicao">
        <p className="rotulo">O MDC custa R$ 997 em 6x no cartão ou R$ 247/mês no Pix. Está disposto a investir? *</p>
        <Escolha nome="disposicao" opcoes={DISPOSICAO} valor={disposicao} onChange={(v) => setDisposicao(v as string)} />
        <E k="disposicao" />
      </div>

      <div className="rounded-2xl border border-dashed border-linha p-5">
        <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-suave">Opcional — ajuda a gente a te conhecer</p>
        <div className="space-y-7">
          <div>
            <label htmlFor="instagram" className="rotulo">Instagram da barbearia</label>
            <input id="instagram" name="instagram" className="campo" placeholder="@suabarbearia" autoCapitalize="none" />
          </div>

          <div>
            <label htmlFor="num_barbeiros" className="rotulo">Quantos barbeiros, contando você</label>
            <input id="num_barbeiros" name="num_barbeiros" className="campo" inputMode="numeric" placeholder="Ex.: 3" maxLength={3} />
          </div>

          <div data-campo="faturamento">
            <p className="rotulo">Faturamento médio por mês</p>
            <Escolha nome="faturamento" opcoes={FATURAMENTO} valor={faturamento} onChange={(v) => setFaturamento(v as string)} colunas={2} />
          </div>

          <div data-campo="dor">
            <p className="rotulo">Maior dor hoje</p>
            <Escolha nome="dor" opcoes={DOR} valor={dor} onChange={(v) => setDor(v as string)} colunas={2} />
            {dor === 'outro' && (
              <input name="dor_outro" className="campo mt-3" placeholder="Conta qual é" maxLength={300} autoFocus />
            )}
          </div>

          <div data-campo="origem">
            <p className="rotulo">Como conheceu o Carlos</p>
            <Escolha nome="origem" opcoes={ORIGEM} valor={origem} onChange={(v) => setOrigem(v as string)} colunas={2} />
          </div>
        </div>
      </div>

      <div data-campo="autoriza">
        <label className="flex cursor-pointer items-start gap-3 text-base">
          <input type="checkbox" name="autoriza" className="mt-1 h-6 w-6 shrink-0 accent-[#D9A441]" required />
          <span>Autorizo o contato sobre o MDC *</span>
        </label>
        <E k="autoriza" />
      </div>

      {mensagem && <p className="rounded-xl bg-perigo/10 p-4 text-base font-medium text-perigo">{mensagem}</p>}

      <button type="submit" className="btn-primario w-full sm:w-full" disabled={pendente}>
        {pendente ? 'Enviando...' : botao}
      </button>
    </form>
  )
}
