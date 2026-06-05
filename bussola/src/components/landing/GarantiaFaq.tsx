'use client'

import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const FAQ = [
  {
    p: 'Como a IA da Bússola funciona, na prática?',
    r: 'Ela lê suas observações, classifica nos 6 momentos da reunião, sugere abordagens fundamentadas em princípios consagrados de liderança e prepara um resumo automático da semana. Você anota e fala. Ela faz a parte difícil de organizar e preparar.',
  },
  {
    p: 'E se eu nunca conduzi reunião antes?',
    r: 'A Bússola foi feita pra isso. Cada momento vem com instrução clara, princípio de liderança e sugestão de fala. Você não decora — só conduz.',
  },
  {
    p: 'Funciona pra qualquer tipo de empresa?',
    r: 'Sim. A Bússola foi desenhada universal — qualquer empresa com equipe. Barbearia, salão, restaurante, loja, oficina, escritório, clínica, agência. A linguagem é neutra, sem termos específicos de setor.',
  },
  {
    p: 'Quantas pessoas cabem na minha conta?',
    r: 'Sem limite. Cadastre quantas pessoas quiser — o preço é o mesmo. A Bússola funciona bem de 3 a 30 pessoas.',
  },
  {
    p: 'Como funciona o "Encontro da Cultura"?',
    r: 'É um encontro online em grupo no Google Meet, 1 hora por mês, sempre na última quinta-feira. Discutimos cultura, vejo cases reais dos donos e respondo dúvidas ao vivo. Você recebe o link todo mês no WhatsApp.',
  },
  {
    p: 'E o suporte WhatsApp, como funciona?',
    r: 'É um canal direto comigo (Carlos), de segunda a sexta, das 14h às 17h. Resposta em até 24h úteis. Suporte a dúvidas de uso da Bússola, liderança e cultura. Pra discussões mais profundas, use o Encontro da Cultura mensal.',
  },
  {
    p: 'E depois dos 100 primeiros, o preço sobe?',
    r: 'Sim. Vai pra R$ 197/ano, sem os bônus. Quem comprar agora, mantém R$ 97 + bônus na próxima renovação.',
  },
  {
    p: 'Como funciona a captação de avaliações no Google?',
    r: 'A Bússola identifica os clientes que deram 5 estrelas internamente e envia um convite automático pra eles avaliarem você no Google. O cliente clica no link, é levado direto pra caixa de avaliação no Google Maps. Em 30 segundos, sua empresa tem uma estrela a mais — sem você precisar pedir.',
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
            <ShieldCheck size={100} strokeWidth={1.5} className="text-verde-musgo" />
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
