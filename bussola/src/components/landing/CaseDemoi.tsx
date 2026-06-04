'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { FeedbackClienteMock } from './mocks/FeedbackClienteMock'
import { CtaCompra } from './CtaCompra'

export function CaseDemoi() {
  return (
    <section className="px-4 py-20 bg-linho/40 border-y border-border overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 space-y-2"
        >
          <h2 className="font-serif text-3xl sm:text-4xl text-preto">O caso da Demôi Barbearia.</h2>
          <p className="text-grafite max-w-2xl mx-auto">
            Carlos Henrique conta como a Bússola virou rotina no negócio dele — e
            por que a cultura virou o forte da equipe.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            {/* TODO: trocar por foto definitiva quando enviada (atualmente carlos.jpg) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/carlos.jpg"
              alt="Carlos Henrique"
              className="w-44 h-44 mx-auto lg:mx-0 rounded-full object-cover border-2 border-marrom mb-3 shadow-md"
            />
            <p className="font-semibold text-text">Carlos Henrique</p>
            <p className="text-sm text-chumbo">Fundador da Bússola</p>
            <p className="text-xs text-chumbo">Dono da Demôi Barbearia · Cássia/MG</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-5 text-grafite leading-relaxed"
          >
            <p>
              Meu negócio cresceu, a equipe foi de 4 pra 11 pessoas, e a reunião
              semanal virou um problema. Era improvisada, cada um saía com a
              sensação diferente do que tinha sido falado, e eu mesmo não tinha
              clareza do que cobrar.
            </p>
            <p>
              Comecei a desenhar a Bússola pra mim. Anotava observações no celular
              durante a semana, e a IA me montava a pauta pronta. Mas o que mudou
              de verdade não foi a reunião — foi a cultura.
            </p>
            <p>
              Os atendimentos passaram a ter mais consistência. Hoje a Demôi faz
              mais de <strong className="text-text">1.700 atendimentos por mês</strong>,
              e a média de avaliação dos clientes é{' '}
              <strong className="text-text">5.0 estrelas</strong>. Coletamos mais
              de uma centena de feedbacks entre os internos e o Google.
            </p>
            <p>
              Não foi a Bússola que fez isso sozinha. Foi a cultura que ela me
              ajudou a construir, semana após semana, na conversa com a equipe.
              Hoje, a cultura é o forte da Demôi.
            </p>

          </motion.div>
        </div>

        {/* EXEMPLOS REAIS DO OUTPUT DA IA */}
        <div className="mt-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <h3 className="font-serif text-2xl sm:text-3xl text-preto">
              Veja como a IA da Bússola escreve.
            </h3>
            <p className="text-grafite text-sm">
              Dois exemplos reais — extraídos do uso real na Demôi.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* CARD A — Resumo da semana */}
            <motion.article
              initial={{ opacity: 0, scale: 0.95, rotate: -1.5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6 }}
              className="rounded-lg border-l-4 border-marrom bg-linho p-5 shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-chumbo font-semibold mb-3">
                Resumo automático da semana
              </p>
              <p className="text-text italic leading-relaxed">
                &ldquo;Semana de puro fogo! Zé Lucas é destaque absoluto com seis
                feedbacks cinco estrelas elogiando atendimento rápido e excelente,
                enquanto Rael bomba com paciência e carisma reconhecidos pelos
                clientes. Ryan e Davi também fecham com louvor na qualidade do
                atendimento.&rdquo;
              </p>
              <p className="text-xs text-chumbo mt-4">— IA da Bússola</p>
            </motion.article>

            {/* CARD B — Princípio + Sugestão de Fala */}
            <motion.article
              initial={{ opacity: 0, scale: 0.95, rotate: 1.5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-lg border-l-4 border-marrom bg-linho p-5 shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-chumbo font-semibold mb-3">
                Princípio de liderança + sugestão de fala
              </p>
              <div className="space-y-3 text-text leading-relaxed">
                <p>
                  <span className="block text-[10px] uppercase tracking-wider text-marrom font-semibold mb-1">
                    Princípio
                  </span>
                  &ldquo;Elogio precisa ser específico ao comportamento, não
                  genérico à pessoa. &lsquo;Atendeu bem&rsquo; é fraco.
                  &lsquo;Atendeu a cliente das 14h com paciência&rsquo; é forte.&rdquo;
                </p>
                <div className="border-t border-marrom/20" />
                <p>
                  <span className="block text-[10px] uppercase tracking-wider text-marrom font-semibold mb-1">
                    Sugestão de fala
                  </span>
                  <span className="italic">
                    &ldquo;Zé, queria reconhecer aqui na frente do time: seu
                    atendimento ao cliente das 14h foi modelo. A paciência que
                    você teve quando ele mudou de ideia no meio do corte mostrou
                    o profissional que você é.&rdquo;
                  </span>
                </p>
              </div>
              <p className="text-xs text-chumbo mt-4">
                — IA da Bússola, momento Reconhecimentos
              </p>
            </motion.article>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center text-sm text-chumbo italic"
          >
            Isso é o que sua IA vai entregar — toda semana, em todas as reuniões.
          </motion.p>
        </div>

        {/* Mídia extra: FeedbackClienteMock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
          className="mt-14 flex flex-col items-center"
        >
          <p className="text-xs uppercase tracking-wider text-marrom font-semibold mb-4">
            A voz dos clientes dentro do painel
          </p>
          <PhoneFrame size="md">
            <FeedbackClienteMock />
          </PhoneFrame>
        </motion.div>

        {/* BOTÃO DE COMPRA #2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 text-center"
        >
          <CtaCompra pulse />
        </motion.div>
      </div>
    </section>
  )
}
