'use client'

import { useState, useTransition } from 'react'
import { salvarCampanha, salvarRegrasGerais, resetarRegrasGerais } from '@/app/dashboard/campanha/actions'
import { formatBRL, nomeMes } from '@/lib/utils'
import { REGRAS_FIXAS } from '@/lib/regras'
import type { CampanhaComDetalhes } from '@/types/database'

interface Props {
  campanha: CampanhaComDetalhes | null
  mes: number
  ano: number
  // Regras gerais atuais da barbearia (vem do server). NULL = nunca editou,
  // mostra o default REGRAS_FIXAS na UI. Array (mesmo vazio) = customizado.
  regrasGeraisDb: string[] | null
}

const SERVICOS_PADRAO: ServicoState[] = [
  { emoji: '⭐', nome: 'Assinatura vendida', pontos: 100, contaComoAssinatura: true  },
  { emoji: '💆', nome: 'Limpeza de pele',   pontos: 30,  contaComoAssinatura: false },
  { emoji: '💧', nome: 'Hidratação',         pontos: 20,  contaComoAssinatura: false },
  { emoji: '👃', nome: 'Depilação nasal',    pontos: 15,  contaComoAssinatura: false },
  { emoji: '🧴', nome: 'Produto vendido',    pontos: 10,  contaComoAssinatura: false },
]

const PREMIOS_PADRAO = [
  { posicao: 1, valor: 600 },
  { posicao: 2, valor: 400 },
  { posicao: 3, valor: 250 },
  { posicao: 4, valor: 150 },
  { posicao: 5, valor: 100 },
]

interface ServicoState { id?: string; emoji: string; nome: string; pontos: number; contaComoAssinatura: boolean }
interface PremioState  { posicao: number; valor: number }

const POSICAO_LABEL = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º']

export default function CampanhaModal({ campanha, mes, ano, regrasGeraisDb }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'servicos' | 'premios' | 'config' | 'regras'>('servicos')

  const [minPontos,      setMinPontos]      = useState(campanha?.min_pontos       ?? 800)
  const [minPontosRecep, setMinPontosRecep] = useState(campanha?.min_pontos_recep ?? 400)
  const [bonusQtd,       setBonusQtd]       = useState(campanha?.bonus_assin_qtd  ?? 10)
  const [bonusValor,     setBonusValor]     = useState(campanha?.bonus_assin_valor ?? 200)
  const [regrasPersonalizadas, setRegrasPersonalizadas] = useState(campanha?.regras_personalizadas ?? '')
  const [quemLanca,      setQuemLanca]      = useState<'barbeiro' | 'dono'>(campanha?.quem_lanca ?? 'barbeiro')

  // Regras gerais — editaveis pelo dono. Inicializa do banco (se ele ja
  // customizou) OU do default REGRAS_FIXAS. Salvar/resetar usa actions
  // proprias (nao acopla com salvarCampanha).
  const [regrasGerais, setRegrasGerais] = useState<string[]>(
    regrasGeraisDb !== null ? regrasGeraisDb : [...REGRAS_FIXAS],
  )
  const [regrasGeraisSalvando, setRegrasGeraisSalvando] = useState(false)
  const [regrasGeraisSucesso, setRegrasGeraisSucesso] = useState(false)
  const ehCustomizado = regrasGeraisDb !== null

  const [servicos, setServicos] = useState<ServicoState[]>(() => {
    // Init: garante que SEMPRE haja exatamente 1 serviço marcado como
    // assinatura — o "slot fixo" da UI. Se a campanha já tem um, mantém.
    // Se não tem (campanha antiga ou nova), cria um default na frente.
    const fromDb = campanha?.campanha_servicos?.length
      ? campanha.campanha_servicos.map(s => ({
          id: s.id, emoji: s.emoji, nome: s.nome, pontos: s.pontos,
          contaComoAssinatura: !!s.conta_como_assinatura,
        }))
      : SERVICOS_PADRAO
    const temAssinatura = fromDb.some(s => s.contaComoAssinatura)
    if (temAssinatura) return fromDb
    // Auto-cria slot de assinatura padrão na frente.
    return [
      { emoji: '⭐', nome: 'Assinatura vendida', pontos: 100, contaComoAssinatura: true },
      ...fromDb,
    ]
  })
  const [premios, setPremios] = useState<PremioState[]>(
    campanha?.campanha_premios?.length
      ? campanha.campanha_premios.map(p => ({ posicao: p.posicao, valor: Number(p.valor) }))
      : PREMIOS_PADRAO
  )

  // `addServico` cria sempre NÃO-assinatura — o slot de assinatura é fixo
  // e único, criado/preservado no init do state acima.
  function addServico() {
    setServicos(p => [...p, { emoji: '✂️', nome: '', pontos: 10, contaComoAssinatura: false }])
  }
  function removeServico(i: number) {
    setServicos(p => p.filter((_, idx) => idx !== i))
  }
  function updateServico(i: number, f: keyof ServicoState, v: string | number | boolean) {
    setServicos(p => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s))
  }

  // Helpers do "slot fixo": índice do item de assinatura (sempre existe
  // por invariante do init) e lista dos outros índices.
  const idxAssinatura = servicos.findIndex(s => s.contaComoAssinatura)
  const assinatura = idxAssinatura >= 0 ? servicos[idxAssinatura] : null
  const outrosIdx = servicos
    .map((_, i) => i)
    .filter(i => i !== idxAssinatura)

  function addPremio() {
    const nextPos = (premios[premios.length - 1]?.posicao ?? 0) + 1
    setPremios(p => [...p, { posicao: nextPos, valor: 0 }])
  }
  function removePremio(i: number) {
    setPremios(p => p.filter((_, idx) => idx !== i))
  }
  function updatePremioValor(i: number, valor: number) {
    setPremios(p => p.map((pr, idx) => idx === i ? { ...pr, valor } : pr))
  }

  function salvar() {
    setErro(null)
    startTransition(async () => {
      const res = await salvarCampanha({ mes, ano, minPontos, minPontosRecep, bonusAssinQtd: bonusQtd, bonusAssinValor: bonusValor, regrasPersonalizadas, quemLanca, servicos, premios })
      if (res?.error) { setErro(res.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost text-sm py-2 px-4 border border-border flex items-center gap-2"
      >
        🏆 {campanha ? 'Editar campanha' : 'Configurar campanha'}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-xl text-text">Campanha de pontos</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">{nomeMes(mes)} {ano}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {([
            { id: 'servicos', label: 'Serviços' },
            { id: 'premios',  label: 'Premiação' },
            { id: 'config',   label: 'Configurações' },
            { id: 'regras',   label: 'Regras' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`flex-1 py-3 text-xs font-sans font-semibold transition-colors
                ${aba === t.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-text'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">

          {/* Aba: Serviços */}
          {aba === 'servicos' && (
            <>
              {/* ── Slot fixo de Assinatura ────────────────────────────
                  Sempre presente, único, sem botão de excluir nem toggle.
                  É o único item que conta pro contador "X/Y assinaturas
                  para bônus" na tela do barbeiro. O dono pode renomear
                  (ex: "Plano clube", "Sócio mensal") — o sistema NÃO se
                  importa com o texto. */}
              {assinatura && idxAssinatura >= 0 && (
                <div className="bg-primary/5 border border-primary/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-sans font-semibold text-primary uppercase tracking-wide">
                      ⭐ Assinatura
                    </span>
                    <span className="text-text-muted text-[11px] font-sans">
                      — conta pro bônus de {formatBRL(bonusValor)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={assinatura.emoji}
                      onChange={e => updateServico(idxAssinatura, 'emoji', e.target.value)}
                      className="input w-14 text-center text-xl px-1 py-1.5"
                      maxLength={4}
                    />
                    <input
                      value={assinatura.nome}
                      onChange={e => updateServico(idxAssinatura, 'nome', e.target.value)}
                      placeholder="Nome (ex: Plano clube)"
                      className="input flex-1 py-1.5 text-sm"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        value={assinatura.pontos}
                        onChange={e => updateServico(idxAssinatura, 'pontos', parseInt(e.target.value) || 0)}
                        className="input w-20 text-center py-1.5 text-sm"
                        min={0}
                      />
                      <span className="text-text-muted text-xs font-sans w-5">pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Outros serviços ──────────────────────────────────── */}
              <div className="flex items-center justify-between pt-3 mb-1">
                <p className="text-text-muted text-xs font-sans">Outros serviços que pontuam (não contam pro bônus de assinatura).</p>
                <button onClick={addServico} className="btn-ghost text-xs py-1 px-3 border border-border shrink-0">+ Adicionar</button>
              </div>
              {outrosIdx.length === 0 && (
                <p className="text-text-muted text-xs font-sans italic text-center py-2">
                  Nenhum outro serviço. Use o botão acima pra adicionar.
                </p>
              )}
              {outrosIdx.map(i => {
                const s = servicos[i]
                return (
                  <div key={i} className="bg-surface-2 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={s.emoji}
                        onChange={e => updateServico(i, 'emoji', e.target.value)}
                        className="input w-14 text-center text-xl px-1 py-1.5"
                        maxLength={4}
                      />
                      <input
                        value={s.nome}
                        onChange={e => updateServico(i, 'nome', e.target.value)}
                        placeholder="Nome do serviço"
                        className="input flex-1 py-1.5 text-sm"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={s.pontos}
                          onChange={e => updateServico(i, 'pontos', parseInt(e.target.value) || 0)}
                          className="input w-20 text-center py-1.5 text-sm"
                          min={0}
                        />
                        <span className="text-text-muted text-xs font-sans w-5">pts</span>
                      </div>
                      <button onClick={() => removeServico(i)} className="text-red-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Aba: Premiação */}
          {aba === 'premios' && (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-text-muted text-xs font-sans">Valor do prêmio por posição no ranking de pontos.</p>
                <button onClick={addPremio} className="btn-ghost text-xs py-1 px-3 border border-border shrink-0">+ Posição</button>
              </div>
              {premios.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3">
                  <span className={`font-serif text-xl w-8 text-center shrink-0
                    ${i === 0 ? 'metal-text-gold' : i === 1 ? 'metal-text-silver' : i === 2 ? 'metal-text-bronze' : 'text-text-muted'}`}>
                    {POSICAO_LABEL[i] ?? `${p.posicao}º`}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-text-muted text-sm font-sans shrink-0">R$</span>
                    <input
                      type="number"
                      value={p.valor}
                      onChange={e => updatePremioValor(i, parseFloat(e.target.value) || 0)}
                      className="input flex-1 py-1.5 text-sm"
                      min={0} step={10}
                    />
                  </div>
                  <button onClick={() => removePremio(i)} className="text-red-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Aba: Configurações */}
          {aba === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="label">Mínimo de pontos — barbeiros</label>
                <input
                  type="number" value={minPontos}
                  onChange={e => setMinPontos(parseInt(e.target.value) || 0)}
                  className="input" min={0}
                />
                <p className="text-text-muted text-xs font-sans mt-1.5">
                  Barbeiros abaixo de {minPontos} pts ficam fora do ranking de premiação.
                </p>
              </div>
              <div>
                <label className="label">Mínimo de pontos — recepcionistas</label>
                <input
                  type="number" value={minPontosRecep}
                  onChange={e => setMinPontosRecep(parseInt(e.target.value) || 0)}
                  className="input" min={0}
                />
                <p className="text-text-muted text-xs font-sans mt-1.5">
                  Recepcionistas abaixo de {minPontosRecep} pts ficam fora do ranking de premiação.
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-sans text-sm text-text mb-1">Quem lança a pontuação diária?</p>
                <p className="text-text-muted text-xs font-sans mb-3">
                  Só vale daqui pra frente. Lançamentos já feitos não são afetados.
                </p>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border cursor-pointer hover:bg-surface-2">
                    <input
                      type="radio" name="quem-lanca"
                      checked={quemLanca === 'barbeiro'}
                      onChange={() => setQuemLanca('barbeiro')}
                      className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-text text-sm font-sans">Cada barbeiro lança a sua</p>
                      <p className="text-text-muted text-[11px] font-sans mt-0.5">
                        O barbeiro abre o link dele e lança pelo celular.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border cursor-pointer hover:bg-surface-2">
                    <input
                      type="radio" name="quem-lanca"
                      checked={quemLanca === 'dono'}
                      onChange={() => setQuemLanca('dono')}
                      className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-text text-sm font-sans">Só o dono lança</p>
                      <p className="text-text-muted text-[11px] font-sans mt-0.5">
                        Esconde o botão de lançar no link do barbeiro. Você lança em
                        Lançamento de pontos &gt; Adicionar lançamento.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-sans text-sm text-text mb-3">Bônus de assinaturas</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Mín. assinaturas vendidas</label>
                    <input
                      type="number" value={bonusQtd}
                      onChange={e => setBonusQtd(parseInt(e.target.value) || 0)}
                      className="input" min={0}
                    />
                  </div>
                  <div>
                    <label className="label">Bônus (R$)</label>
                    <input
                      type="number" value={bonusValor}
                      onChange={e => setBonusValor(parseFloat(e.target.value) || 0)}
                      className="input" min={0} step={10}
                    />
                  </div>
                </div>
                <p className="text-text-muted text-xs font-sans mt-2">
                  Ao vender {bonusQtd}+ assinaturas, o barbeiro ganha {formatBRL(bonusValor)} de bônus.
                </p>
              </div>
            </div>
          )}

          {/* Aba: Regras */}
          {aba === 'regras' && (
            <div className="space-y-5">
              <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-sans font-semibold text-text text-sm flex items-center gap-2">
                    <span aria-hidden>📋</span> Regras gerais da campanha
                  </p>
                  {ehCustomizado && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Voltar ao texto padrão do sistema? Sua versão será descartada.')) return
                        setRegrasGeraisSalvando(true)
                        resetarRegrasGerais().then(res => {
                          setRegrasGeraisSalvando(false)
                          if (res?.error) { setErro(res.error); return }
                          setRegrasGerais([...REGRAS_FIXAS])
                          setRegrasGeraisSucesso(true)
                          setTimeout(() => setRegrasGeraisSucesso(false), 1500)
                        })
                      }}
                      className="text-text-muted hover:text-text text-[11px] font-sans underline"
                    >
                      ↺ Restaurar padrão
                    </button>
                  )}
                </div>
                <p className="text-text-muted text-xs font-sans">
                  Editáveis. Aparecem na aba Regras pros barbeiros, junto com as suas observações abaixo.
                </p>

                <div className="space-y-2">
                  {regrasGerais.length === 0 && (
                    <p className="text-text-muted text-xs font-sans italic py-2">
                      Sem regras gerais. Adicione abaixo ou restaure o padrão.
                    </p>
                  )}
                  {regrasGerais.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface rounded-lg p-2">
                      <span className="text-green-400 mt-2 shrink-0 leading-none">✓</span>
                      <textarea
                        value={r}
                        onChange={e => setRegrasGerais(arr => arr.map((x, idx) => idx === i ? e.target.value.slice(0, 500) : x))}
                        rows={2}
                        className="input flex-1 text-sm py-1.5 leading-relaxed"
                        style={{ resize: 'vertical', minHeight: 48 }}
                      />
                      <button
                        type="button"
                        onClick={() => setRegrasGerais(arr => arr.filter((_, idx) => idx !== i))}
                        className="text-red-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 shrink-0 mt-0.5"
                        aria-label="Remover regra"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRegrasGerais(arr => [...arr, ''])}
                    className="btn-ghost text-xs py-1.5 px-3 border border-border"
                  >
                    + Adicionar regra
                  </button>
                  <button
                    type="button"
                    disabled={regrasGeraisSalvando}
                    onClick={() => {
                      setRegrasGeraisSalvando(true)
                      salvarRegrasGerais(regrasGerais).then(res => {
                        setRegrasGeraisSalvando(false)
                        if (res?.error) { setErro(res.error); return }
                        setRegrasGeraisSucesso(true)
                        setTimeout(() => setRegrasGeraisSucesso(false), 1500)
                      })
                    }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {regrasGeraisSucesso ? '✓ Salvo!' : regrasGeraisSalvando ? 'Salvando…' : 'Salvar regras'}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">+ Observações personalizadas (texto livre)</label>
                <p className="text-text-muted text-xs font-sans mb-2">
                  Combinados específicos da sua barbearia (opcional). Salvas junto com o &ldquo;Salvar campanha&rdquo; lá embaixo.
                </p>
                <textarea
                  value={regrasPersonalizadas}
                  onChange={e => setRegrasPersonalizadas(e.target.value)}
                  rows={6}
                  placeholder="Ex: Não vale lançar serviços antes de cobrar. Lançamentos têm que ser feitos até o fim do expediente."
                  className="input w-full text-sm font-sans leading-relaxed"
                  style={{ resize: 'vertical', minHeight: '120px' }}
                />
              </div>
            </div>
          )}

          {erro && <p className="text-red-400 text-sm font-sans pt-2">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
          <button onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm py-2.5">Cancelar</button>
          <button onClick={salvar} disabled={isPending} className="btn-primary flex-1 text-sm py-2.5">
            {isPending ? 'Salvando…' : 'Salvar campanha'}
          </button>
        </div>
      </div>
    </div>
  )
}
