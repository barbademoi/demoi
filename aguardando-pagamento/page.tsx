'use client'

import { motion } from 'framer-motion'

export default function AguardandoPagamentoPage() {
  return (
    <main className="min-h-screen bg-[#0A1929] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
        </div>

        {/* Ampulheta animada */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, 0, 180, 180, 360] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.4, 0.5, 0.9, 1],
            }}
            className="text-[#D4A85A]"
          >
            <Hourglass />
          </motion.div>
        </div>

        {/* Título + descrição */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl text-text mb-3">
            Sua compra está sendo processada
          </h2>
          <p className="text-text-muted text-base leading-relaxed">
            Recebemos seu pedido. Assim que o pagamento for confirmado,
            você receberá um email com o link para acessar o BarberMeta.
          </p>
        </div>

        {/* 3 cenários */}
        <div className="space-y-3 mb-10">
          <Cenario
            titulo="Pagou por Pix"
            texto="Confirmação em até 5 minutos. Pode aguardar nesta tela ou fechar — o email chega normalmente."
          />
          <Cenario
            titulo="Pagou por Boleto"
            texto="O banco compensa em 1 a 3 dias úteis. Você receberá o email assim que cair."
          />
          <Cenario
            titulo="Cartão em análise"
            texto="A operadora está verificando a transação. Costuma sair em alguns minutos, mas pode levar até 2 horas."
          />
        </div>

        {/* CTA texto */}
        <div className="text-center mb-8">
          <p className="text-text text-sm">
            Pode fechar esta página tranquilo —
            o <span className="text-[#D4A85A]">email de confirmação</span> chega assim que o pagamento for aprovado.
          </p>
        </div>

        {/* Suporte */}
        <div className="text-center pt-6 border-t border-white/5">
          <p className="text-xs text-text-muted">
            Algum problema? Escreva para{' '}
            <a
              href="mailto:suporte@barbermeta.com.br"
              className="text-[#D4A85A] hover:underline"
            >
              suporte@barbermeta.com.br
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

function Cenario({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-text font-medium text-sm mb-1">{titulo}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{texto}</p>
    </div>
  )
}

function Hourglass() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  )
}
