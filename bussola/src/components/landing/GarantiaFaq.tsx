'use client'

import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const FAQ = [
  {
    p: 'Funciona pra qualquer tipo de empresa?',
    r: 'Sim. A Bússola foi desenhada universal — qualquer empresa com equipe. Barbearia, salão, restaurante, loja, oficina, escritório, clínica, agência. A linguagem é neutra, sem termos específicos de setor. O que importa é construir cultura — e isso vale pra qualquer negócio.',
  },
  {
    p: 'Quantas pessoas cabem na minha conta?',
    r: 'Sem limite. Cadastre quantas pessoas quiser — o preço é o mesmo. A Bússola funciona bem de 3 a 30 pessoas.',
  },
  {
    p: 'Preciso ensinar minha equipe a usar?',
    r: 'Não. Sua equipe acessa um link único pelo celular, sem app, sem login. Em 30 segundos entendem.',
  },
  {
    p: 'E se eu nunca conduzi reunião antes?',
    r: 'A Bússola foi feita pra isso. Cada momento da reunião vem com instrução, princípio de liderança e sugestão de fala. Você não decora — só conduz.',
  },
  {
    p: 'Funciona no celular?',
    r: 'Sim, totalmente. A Bússola é mobile-first. 99% do uso é pelo celular, pra você e pra equipe.',
  },
  {
    p: 'O pagamento é mensal ou anual?',
    r: 'Anual. Você paga R$ 97 uma vez e tem acesso por 12 meses. Sem cartão recorrente, sem cobrança mensal.',
  },
  {
    p: 'E depois dos 100 primeiros, o preço sobe?',
    r: 'Sim. A oferta de R$ 97 é só para os primeiros 100. Depois disso, o valor passa a R$ 197/ano. Quem comprar agora, mantém R$ 97 na próxima renovação.',
  },
  {
    p: 'Posso testar antes?',
    r: 'Não temos versão grátis, mas oferecemos 7 dias de garantia integral. Compra, testa, e se não gostar, devolvemos seu dinheiro.',
  },
]

export function GarantiaFaq() {
  return (
    <section className="px-4 py-16 bg-surface border-y border-border">
      <div className="max-w-3xl mx-auto space-y-16">
        {/* GARANTIA */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="inline-flex"
          >
            <ShieldCheck size={56} strokeWidth={1.5} className="text-verde-musgo" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-3xl sm:text-4xl text-preto"
          >
            7 dias pra decidir.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-grafite max-w-xl mx-auto leading-relaxed"
          >
            Não gostou? Devolvemos seu dinheiro integralmente, sem pergunta. Em até
            7 dias após a compra, basta enviar uma mensagem solicitando reembolso.
            Nosso compromisso é com o seu resultado, não com sua assinatura.
          </motion.p>
        </div>

        {/* FAQ */}
        <div>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-2xl sm:text-3xl text-preto text-center mb-8"
          >
            Perguntas que você provavelmente tem.
          </motion.h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <motion.details
                key={item.p}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-md border border-border bg-background open:bg-linho/40"
              >
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 font-medium text-text text-sm sm:text-base">
                  <span>{item.p}</span>
                  <span className="text-marrom text-xl transition-transform group-open:rotate-45 select-none">+</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-grafite leading-relaxed">{item.r}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
