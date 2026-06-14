'use client'

// Modal de preview do PLUS — explica os 2 modulos premium pra quem clicar
// num item bloqueado da sidebar (Feedback Premiado ou Financeiro).
// Mostra os 2 lado a lado + CTA unico pra desbloquear ambos por R$29.

import { useEffect } from 'react'

const CHECKOUT_PLUS_URL = 'https://pay.hotmart.com/P106317414B'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PreviewPlusModal({ open, onClose }: Props) {
  // Fecha com Esc.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-start sm:items-center justify-center p-4 py-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-8 rounded-2xl border-2 border-[#D4A85A] bg-gradient-to-b from-[#0F1117] to-[#1A1410] shadow-2xl"
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 text-text-muted hover:text-text text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors z-10"
        >
          ×
        </button>

        {/* Header */}
        <div className="p-6 sm:p-8 text-center">
          <span className="inline-block rounded-full bg-[#D4A85A] text-[#0F1117] text-[10px] font-bold uppercase tracking-wider px-3 py-1 mb-3">
            ⭐ BarberMeta Plus
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-text mb-2">
            Conheça os 2 módulos premium
          </h2>
          <p className="text-text-muted text-sm sm:text-base font-sans leading-relaxed max-w-xl mx-auto">
            Por <strong className="text-text">R$ 29</strong> de uma vez você desbloqueia
            os 2 adicionais que vão <strong className="text-[#D4A85A]">trazer cliente de volta</strong>{' '}
            e <strong className="text-[#D4A85A]">organizar o financeiro da barbearia</strong>.
          </p>
        </div>

        {/* Grid dos 2 modulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6 pb-4">

          {/* ── Feedback Premiado ── */}
          <div className="rounded-2xl border border-[#D4A85A]/30 bg-[#0A1929] overflow-hidden">
            <div className="bg-[#D4A85A]/10 px-5 py-3 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider">Módulo 1</p>
                <h3 className="text-text font-bold text-base">Feedback Premiado</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-text-muted text-sm font-sans leading-relaxed">
                Cliente avalia → ganha brinde → barbeiro vê o brinde no link dele → oferece no próximo atendimento.
                <strong className="text-text"> O cliente volta.</strong>
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Link público + QR Code pra clientes avaliarem</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Brindes sorteados por peso (você define a chance)</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Validade do brinde configurável (15/30/60/90 dias)</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>5★ vai direto pro Google Reviews</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Brinde aparece no link do barbeiro pra oferecer depois</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Controle Financeiro ── */}
          <div className="rounded-2xl border border-[#D4A85A]/30 bg-[#0A1929] overflow-hidden">
            <div className="bg-[#D4A85A]/10 px-5 py-3 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider">Módulo 2</p>
                <h3 className="text-text font-bold text-base">Controle Financeiro</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-text-muted text-sm font-sans leading-relaxed">
                Caixa, contas, folha e fluxo de caixa do mês — tudo num lugar só.
                <strong className="text-text"> Você sabe quanto sobra.</strong>
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Caixa por conta (banco, dinheiro, Pix)</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Contas a pagar (única, fixa, parcelada)</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Contas a receber</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Folha da equipe — comissão sincroniza do BM</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Quanto sobra no mês (demonstrativo claro)</span>
                </li>
                <li className="flex items-start gap-2 text-text font-sans">
                  <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                  <span>Empresa + Pessoal separados</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 space-y-3">
          <div className="rounded-xl bg-[#D4A85A]/10 border border-[#D4A85A]/30 p-4 text-center">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wider mb-1">
              Os 2 módulos por
            </p>
            <p className="text-4xl font-bold text-[#D4A85A] leading-none">R$ 29</p>
            <p className="text-text-muted text-xs font-sans mt-1">
              Pagamento único · Sem mensalidade
            </p>
          </div>

          <a
            href={CHECKOUT_PLUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-xl bg-[#D4A85A] hover:bg-[#E6CB8A] text-[#0F1117] font-bold py-3.5 text-base transition-colors"
          >
            Desbloquear os 2 — R$ 29
          </a>

          <button
            onClick={onClose}
            className="block w-full text-center text-text-muted hover:text-text text-sm font-sans py-2 transition-colors"
          >
            Agora não
          </button>

          <p className="text-text-muted text-[11px] font-sans text-center">
            Liberação automática após a compra. Comprou com outro e-mail? Fale com o suporte.
          </p>
        </div>
      </div>
    </div>
  )
}
