'use client'

import { motion } from 'framer-motion'
import { Check, Gift } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { SiGooglemeet } from 'react-icons/si'
import { FcGoogle } from 'react-icons/fc'
import { CtaCompra } from './CtaCompra'

// Itens com componente opcional de ícone customizado/mini-print no final
type Inclusao = {
  texto: string
  extra?: React.ReactNode
}

const INCLUSOES: Inclusao[] = [
  { texto: 'IA mentora treinada nos fundamentos da gestão' },
  { texto: 'Modo Reunião com 6 momentos guiados' },
  { texto: 'Resumo automático da semana' },
  { texto: 'Equipe sem limite de pessoas' },
  {
    texto: 'Feedback de clientes com brindes',
    extra: <Gift size={16} strokeWidth={1.5} className="text-marrom shrink-0" />,
  },
  {
    texto: 'Integração com Google Reviews',
    extra: <FcGoogle size={18} className="shrink-0" />,
  },
  {
    texto: 'Tutoriais embutidos no sistema',
    extra: (
      <span className="hidden md:inline-block w-12 h-16 rounded overflow-hidden border border-border shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/oferta-tutoriais-mobile.png"
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
      </span>
    ),
  },
  { texto: 'Acesso pelo celular (PWA)' },
]

export function OfertaPreco() {
  return (
    <section id="oferta" className="px-4 py-20 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 space-y-2"
      >
        <h2 className="font-serif text-3xl sm:text-4xl text-preto">Seja um dos 100 primeiros.</h2>
        <p className="text-grafite">
          Acesso completo à Bússola por R$ 97 pelo ano todo. Pagamento único,
          sem mensalidade.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border-2 border-marrom bg-surface shadow-lg p-6 sm:p-8 space-y-6"
      >
        <div className="inline-flex items-center gap-1.5 bg-linho text-marrom text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
          Oferta de lançamento · 100 primeiros clientes
        </div>

        <div className="space-y-1">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-grafite line-through text-base"
          >
            De R$ 197/ano
          </motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="font-serif text-5xl sm:text-6xl text-marrom font-bold leading-none"
          >
            R$ 97
          </motion.p>
          <p className="text-chumbo text-sm">por 12 meses de acesso</p>
        </div>

        {/* Lista de inclusões */}
        <ul className="space-y-2.5 pt-2">
          {INCLUSOES.map((item, i) => (
            <motion.li
              key={item.texto}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="flex items-start gap-2 text-sm text-text"
            >
              <Check size={16} strokeWidth={2.2} className="text-verde-musgo mt-0.5 shrink-0" />
              <span className="flex-1">{item.texto}</span>
              {item.extra}
            </motion.li>
          ))}
        </ul>

        {/* Separador */}
        <div className="border-t border-border" />

        {/* Bônus */}
        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.5 }}
            className="font-serif text-xl text-marrom text-center"
          >
            E você ainda ganha 2 bônus exclusivos:
          </motion.p>

          <BonusCard
            badge="Bônus #1 · Comunidade"
            icone={
              <motion.span
                initial={{ scale: 0.85 }}
                whileInView={{ scale: [0.85, 1.1, 1] }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.7 }}
              >
                <SiGooglemeet size={42} className="text-[#00897B]" />
              </motion.span>
            }
            titulo="Encontro da Cultura"
            sub="Mentoria em grupo · 1h por mês · Google Meet · Direto com Carlos Henrique"
            descricao="Toda última quinta do mês, encontro online em grupo onde discutimos cultura, cases reais entre os membros, e respondo dúvidas ao vivo. Você aprende com os erros e acertos dos outros donos."
            valor="Valor real: R$ 297/ano"
          />

          <BonusCard
            badge="Bônus #2 · Suporte"
            icone={
              <motion.span
                initial={{ scale: 0.85 }}
                whileInView={{ scale: [0.85, 1.1, 1] }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <FaWhatsapp size={42} className="text-[#25D366]" />
              </motion.span>
            }
            titulo="Suporte WhatsApp direto comigo"
            sub="Atendimento de segunda a sexta · 14h às 17h · Resposta em até 24h úteis"
            descricao="Travou em alguma reunião? Não sabe como abordar algo difícil com sua equipe? Manda mensagem direto no meu WhatsApp. Atendimento das 14h às 17h em dias úteis, com resposta em até 24h."
            valor="Valor real: R$ 197/ano"
          />
        </div>

        {/* Totalização */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-5%' }}
          transition={{ duration: 0.6 }}
          className="bg-linho/50 rounded-md p-4 space-y-1.5 text-sm"
        >
          <Linha label="Bússola anual:" valor="R$ 197" />
          <Linha label="Encontro da Cultura:" valor="R$ 297" />
          <Linha label="Suporte WhatsApp:" valor="R$ 197" />
          <div className="border-t border-marrom/30 my-2" />
          <Linha label="Total:" valor="R$ 691/ano" bold />
          <div className="pt-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: [0.85, 1.08, 1], opacity: 1 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="text-text font-semibold">Você paga hoje:</span>
              <span className="font-serif text-3xl sm:text-4xl text-marrom font-bold">R$ 97</span>
            </motion.div>
          </div>
        </motion.div>

        <CtaCompra variant="large" pulse className="w-full justify-center" />

        <p className="text-xs text-chumbo text-center">
          Pagamento pelo Hotmart · 7 dias de garantia incondicional
        </p>
      </motion.div>

      <p className="text-center text-sm text-chumbo mt-6">
        Após os primeiros 100, o valor passa a ser R$ 197/ano — sem bônus.
      </p>
    </section>
  )
}

function BonusCard({
  badge,
  icone,
  titulo,
  sub,
  descricao,
  valor,
}: {
  badge: string
  icone: React.ReactNode
  titulo: string
  sub: string
  descricao: string
  valor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.6 }}
      className="rounded-lg bg-linho/60 border border-marrom/30 p-4 sm:p-5 space-y-3"
    >
      <span className="inline-block text-[10px] uppercase tracking-wider text-marrom font-semibold">
        {badge}
      </span>
      <div className="flex items-start gap-3">
        <div className="shrink-0">{icone}</div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-text">{titulo}</h3>
          <p className="text-xs text-chumbo">{sub}</p>
        </div>
      </div>
      <p className="text-sm text-grafite leading-relaxed">{descricao}</p>
      <p className="text-xs text-marrom font-semibold">{valor}</p>
    </motion.div>
  )
}

function Linha({ label, valor, bold = false }: { label: string; valor: string; bold?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${bold ? 'font-semibold text-text' : 'text-grafite'}`}>
      <span>{label}</span>
      <span className="font-mono">{valor}</span>
    </div>
  )
}
