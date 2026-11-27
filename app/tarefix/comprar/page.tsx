import type { Metadata } from 'next'
import Image from 'next/image'
import { Logo } from '@/components/tarefix/Logo'
import { tarefixPaymentConfig } from '@/lib/tarefixModulo/config'
import { FormCompra } from './FormCompra'

export const metadata: Metadata = {
  title: 'Tarefix: a rotina do seu negócio no piloto automático',
  description: 'Tarefas da equipe no celular, com horário, prova com foto e um painel que mostra quem cumpriu. R$ 47, pagamento único.',
  openGraph: {
    title: 'Tarefix: pare de cobrar a equipe no grupo',
    description: 'Tarefas da equipe no celular, com prova e acompanhamento em tempo real. R$ 47, pagamento único.',
    images: ['/tarefix/vendas/painel.jpg'],
  },
}

const DORES = [
  'Você chega e o lugar não está do jeito que deveria: sujo, desorganizado, nada pronto.',
  'Repete a mesma coisa todo dia no grupo do WhatsApp — e ninguém lê.',
  'O produto acabou e ninguém avisou. O cliente quis comprar e não tinha.',
  'O post do dia não foi feito. O relatório não foi enviado. De novo.',
  'Você só descobre que algo não foi feito quando o cliente reclama.',
  'No fim, você virou fiscal do próprio negócio em vez de dono dele.',
]

const PASSOS = [
  ['1', 'Você monta a rotina uma vez', 'Cadastre a equipe e as tarefas: quem faz, em quais dias e até que horas. Pode pedir checklist e foto de prova.'],
  ['2', 'Cada um recebe no celular', 'O colaborador abre o link dele, digita o PIN e vê só as tarefas do dia. Sem baixar aplicativo. Na hora certa, o celular lembra.'],
  ['3', 'Você acompanha sem cobrar', 'No seu painel aparece quem já fez, quem atrasou e a % do dia de cada um. As fotos chegam para você aprovar ou devolver.'],
]

const RECURSOS = [
  ['⏰', 'Tarefas com horário', 'Abrir às 8h, story até as 16h, caixa às 20h.'],
  ['✅', 'Checklist passo a passo', 'A limpeza do jeito que você quer, item por item.'],
  ['📷', 'Foto de prova', 'Nada de “eu fiz”: tem que mostrar.'],
  ['↩️', 'Aprovar ou devolver', 'Não ficou bom? Devolve com o motivo e ele refaz.'],
  ['🔔', 'Lembrete no celular', 'Notificação na hora, com botão de “feito”.'],
  ['🏆', 'Bônus por desempenho', 'Opcional: 90% no mês = R$ 50, 100% = R$ 100 (você escolhe).'],
  ['📅', 'O mês de cada um', 'Calendário colorido: quem é constante aparece.'],
  ['🔥', 'Meu dia (para você)', 'Sua lista de dono: fornecedor, contador, caixa…'],
]

const FAQ = [
  ['Precisa baixar aplicativo?', 'Não. Funciona no navegador de qualquer celular. Se quiser, dá para colocar o ícone na tela de início, como um app.'],
  ['Como a equipe entra?', 'Cada colaborador recebe um link próprio e um PIN de 4 números. Ele vê só as tarefas dele.'],
  ['Tem mensalidade?', 'Não. São R$ 47 uma única vez.'],
  ['Como recebo o acesso?', 'Depois que o Pix é conferido, você recebe no WhatsApp o link, o seu e-mail de login e uma senha provisória.'],
  ['Serve para o meu tipo de negócio?', 'Sim. Qualquer rotina que se repete vira tarefa: abrir e fechar, limpeza, estoque, atendimento, redes sociais, caixa, relatórios… em qualquer função e qualquer ramo.'],
  ['E se eu não tiver equipe?', 'Use o “Meu dia”: a sua lista de tarefas com lembretes, para não esquecer nada do dia.'],
]

function Celular({ src, alt, legenda, texto }: { src: string; alt: string; legenda: string; texto: string }) {
  return (
    <figure className="flex flex-col items-center">
      <div className="w-full max-w-[290px] overflow-hidden rounded-[34px] border-[8px] border-[#17152b] bg-[#17152b] shadow-[0_30px_60px_-20px_rgba(23,21,43,0.45)]">
        <div className="relative h-[520px] overflow-hidden rounded-[26px] bg-[#f4f3f8]">
          <Image src={src} alt={alt} width={780} height={1600} className="w-full" style={{ height: 'auto' }} sizes="290px" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f4f3f8] to-transparent" />
        </div>
      </div>
      <figcaption className="mt-4 max-w-[300px] text-center">
        <span className="block text-lg font-black">{legenda}</span>
        <span className="block text-sm text-tf-suave">{texto}</span>
      </figcaption>
    </figure>
  )
}

export default function Comprar() {
  const pay = tarefixPaymentConfig()
  const cta = 'tf-botao w-full px-8 text-base sm:w-auto'
  return (
    <main className="pb-24">
      {/* topo */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo className="text-3xl" />
        <a href="/tarefix/entrar" className="text-sm font-bold text-tf-suave hover:text-tf-texto">
          Já comprei: entrar
        </a>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-6 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex rounded-full bg-tf-marca-clara px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-tf-marca-texto">Para qualquer negócio ou pessoa</span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            Sua equipe faz o que tem que ser feito. <span className="text-tf-marca-texto">Sem você precisar cobrar.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-tf-suave">
            O Tarefix transforma a rotina em processo: cada pessoa recebe no celular as tarefas com horário, manda a prova com foto, e você vê num painel quem cumpriu. Serve para barbearia, salão, clínica, loja, restaurante, escritório… ou só para você.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#comprar" className={cta}>
              Quero organizar meu negócio
            </a>
            <span className="text-center text-sm text-tf-suave sm:text-left">
              <b className="text-tf-texto">R$ 47</b> · pagamento único
            </span>
          </div>
        </div>
        <Celular src="/tarefix/vendas/painel.jpg" alt="Painel do dono no Tarefix mostrando a % de cada colaborador" legenda="O seu painel" texto="Quem já fez, quem falta, e a % do dia de cada um." />
      </section>

      {/* dor */}
      <section className="bg-[#17152b] py-16 text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Você conhece essa rotina?</h2>
          <ul className="mt-8 space-y-4">
            {DORES.map((d) => (
              <li key={d} className="flex gap-3 text-lg leading-relaxed text-white/85">
                <span className="mt-1 text-[#ff6b6b]" aria-hidden>
                  ✕
                </span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 rounded-2xl border border-white/15 bg-white/5 p-5 text-lg leading-relaxed">
            Cada coisa esquecida custa <b>cliente</b>, <b>imagem</b> e o <b>seu tempo</b>. E o problema não é a equipe ser ruim: é que <b>ninguém lembra de tudo, todo dia, sem um sistema</b>.
          </p>
        </div>
      </section>

      {/* solução */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-tf-marca-texto">A solução</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">O Tarefix faz a cobrança por você</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PASSOS.map(([n, t, x]) => (
            <div key={n} className="tf-cartao p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tf-marca text-lg font-black text-white">{n}</span>
              <h3 className="mt-4 text-xl font-black">{t}</h3>
              <p className="mt-2 leading-relaxed text-tf-suave">{x}</p>
            </div>
          ))}
        </div>
      </section>

      {/* por dentro */}
      <section className="bg-tf-marca-clara py-16">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-center text-sm font-extrabold uppercase tracking-[0.16em] text-tf-marca-texto">Por dentro do Tarefix</p>
          <h2 className="mt-2 text-center text-3xl font-black tracking-tight sm:text-4xl">Telas reais, do jeito que você e a equipe vão usar</h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-6">
            <Celular src="/tarefix/vendas/colaborador.jpg" alt="Tela do colaborador com as tarefas do dia" legenda="O que o colaborador vê" texto="As tarefas dele, com horário, checklist e câmera para a foto. O termômetro mostra o dia e o mês." />
            <Celular src="/tarefix/vendas/painel.jpg" alt="Painel do dono com o andamento da equipe" legenda="O que você vê" texto="A equipe inteira numa tela. Tocou na tarefa, vê a foto e aprova ou devolve." />
            <Celular src="/tarefix/vendas/mes.jpg" alt="Calendário do mês e bônus do colaborador" legenda="O mês e o bônus" texto="Cada dia ganha a cor do resultado. Se você ligar o bônus, ele sabe quanto falta para ganhar." />
          </div>
        </div>
      </section>

      {/* recursos */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Tudo o que vem no Tarefix</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS.map(([i, t, x]) => (
            <div key={t} className="tf-cartao p-5">
              <span className="text-2xl" aria-hidden>
                {i}
              </span>
              <h3 className="mt-2 font-black">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-tf-suave">{x}</p>
            </div>
          ))}
        </div>
      </section>

      {/* preço + compra */}
      <section id="comprar" className="scroll-mt-4 bg-[#17152b] py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-2 md:items-start">
          <div className="text-white">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Organize sua rotina hoje</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">Menos do que um almoço fora. Uma vez só, sem mensalidade.</p>
            <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-white/70">Tarefix completo</p>
              <p className="mt-1 text-5xl font-black">R$ 47</p>
              <p className="mt-1 text-white/70">pagamento único no Pix</p>
              <ul className="mt-6 space-y-2 text-white/85">
                {['Equipe com link e PIN', 'Tarefas com horário, checklist e foto', 'Painel em tempo real', 'Lembretes no celular', 'Bônus por desempenho', 'Meu dia para o dono'].map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-[#8b74ff]">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 text-sm text-white/60">Depois do Pix, o acesso chega no seu WhatsApp assim que o pagamento é conferido.</p>
          </div>
          <FormCompra pixKey={pay.pixKey} pixReceiver={pay.pixReceiver} pixQrImageUrl={pay.pixQrImageUrl} pixPaymentUrl={pay.pixPaymentUrl} />
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-3xl font-black tracking-tight">Perguntas frequentes</h2>
        <div className="mt-6 divide-y divide-tf-borda">
          {FAQ.map(([p, r]) => (
            <details key={p} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {p}
                <span className="text-tf-marca-texto transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-tf-suave">{r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA fixo no celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-tf-borda bg-tf-card/95 p-3 backdrop-blur md:hidden">
        <a href="#comprar" className="tf-botao w-full">
          Quero o Tarefix por R$ 47
        </a>
      </div>
    </main>
  )
}
