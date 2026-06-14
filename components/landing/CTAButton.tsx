'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackInitiateCheckout } from '@/lib/pixel'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'
const CHECKOUT_URL = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'
const CHECKOUT_COMBO_URL = 'https://pay.hotmart.com/K106318479K'

export default function CTAButton({ size = 'lg', className = '', label }: Props) {
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`
  const [showModal, setShowModal] = useState(false)

  const padding = size === 'lg'
    ? 'px-8 py-5 text-lg'
    : size === 'md'
    ? 'px-6 py-4 text-base'
    : 'px-4 py-3 text-sm'

  // Vai pra checkout direto do BarberMeta R$47.
  function goToBarberMeta() {
    trackInitiateCheckout(Number(PRECO) || 47)
    setTimeout(() => {
      window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    }, 200)
  }

  // Vai pra checkout do Combo R$67.
  function goToCombo() {
    trackInitiateCheckout(67)
    setTimeout(() => {
      window.open(CHECKOUT_COMBO_URL, '_blank', 'noopener,noreferrer')
    }, 200)
  }

  // Sempre intercepta com o modal de upsell — TODO clique em CTA do R$47
  // mostra a oferta do combo antes de seguir.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setShowModal(true)
  }

  function escolheuCombo() {
    setShowModal(false)
    goToCombo()
  }

  function escolheuBM() {
    setShowModal(false)
    goToBarberMeta()
  }

  return (
    <>
      <motion.a
        href={CHECKOUT_URL}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`
          inline-block rounded-xl font-bold text-black text-center
          bg-[#D4A85A] hover:bg-[#e0b96a] transition-colors
          shadow-lg shadow-[#D4A85A]/20
          ${padding} ${className}
        `}
      >
        {text}
      </motion.a>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={escolheuBM}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-start sm:items-center justify-center p-4 py-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md my-auto rounded-2xl border-2 border-[#D4A85A] bg-gradient-to-b from-[#0F1117] to-[#1A1410] p-6 sm:p-8 relative"
            >
              <button
                onClick={escolheuBM}
                aria-label="Fechar"
                className="absolute top-3 right-3 text-[#A0AEC0] hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>

              <div className="text-center mb-5">
                <span className="inline-block rounded-full bg-[#D4A85A] text-[#0F1117] text-[10px] font-bold uppercase tracking-wider px-3 py-1 mb-3">
                  ⭐ Oferta exclusiva
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Antes de continuar…
                </h3>
                <p className="text-[#A0AEC0] text-sm mt-2 leading-relaxed">
                  Por <strong className="text-white">só R$ 20 a mais</strong> você leva o <strong className="text-[#D4A85A]">Combo PLUS</strong>:
                  <br />BarberMeta + <strong className="text-white">Feedback Premiado</strong> + <strong className="text-white">Controle Financeiro</strong>
                </p>
              </div>

              <ul className="space-y-2 mb-5 bg-white/5 rounded-xl p-4 border border-white/10">
                <li className="flex items-start gap-2 text-sm text-[#E2E8F0]">
                  <span className="text-[#D4A85A] mt-0.5">★</span>
                  <span><strong>Feedback Premiado</strong> — link público, brindes sorteados e direcionamento pro Google. <strong className="text-white">O cliente volta.</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#E2E8F0]">
                  <span className="text-[#D4A85A] mt-0.5">★</span>
                  <span><strong>Controle Financeiro</strong> — caixa, contas a pagar/receber, folha auto-sync e quanto sobra no mês</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#E2E8F0]">
                  <span className="text-[#D4A85A] mt-0.5">★</span>
                  <span><strong>Acesso vitalício</strong> aos 3 módulos · Sem mensalidade</span>
                </li>
              </ul>

              <button
                onClick={escolheuCombo}
                className="w-full rounded-xl bg-[#D4A85A] hover:bg-[#e0b96a] text-[#0F1117] font-bold py-3.5 text-base transition-colors mb-3"
              >
                Quero o Combo PLUS — R$ 67
              </button>

              <button
                onClick={escolheuBM}
                className="w-full text-[#A0AEC0] hover:text-white text-xs sm:text-sm py-2 transition-colors"
              >
                Não, vou levar só o BarberMeta a R$ 47
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
