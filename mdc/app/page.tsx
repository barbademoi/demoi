import Marca from '@/components/Marca'
import Paragrafos from '@/components/Paragrafos'
import FormularioLista from '@/components/lista/FormularioLista'
import { LANDING_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function ListaDeEspera() {
  const t = await lerConfig('landing', LANDING_PADRAO)

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-10">
        <Marca />
      </header>

      <section className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-latao">Lista de espera · MDC</p>
        <h1 className="text-balance text-4xl font-black leading-[1.08] sm:text-5xl">{t.titulo}</h1>
        <p className="mt-5 text-lg text-suave sm:text-xl">{t.subtitulo}</p>
        <a href="#lista" className="btn-primario mt-8">
          {t.botao}
        </a>
      </section>

      <section className="mb-10 text-lg leading-relaxed text-texto/90">
        <Paragrafos texto={t.texto} />
      </section>

      <section className="card mb-6 p-6">
        <h2 className="mb-5 text-2xl font-bold">{t.beneficios_titulo}</h2>
        <ul className="space-y-4">
          {t.beneficios.map((b, i) => (
            <li key={i} className="flex gap-3 text-base leading-snug">
              <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-latao/15 text-sm font-bold text-latao">
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mb-12 p-6">
        <h2 className="mb-5 text-2xl font-bold">{t.nao_titulo}</h2>
        <ul className="space-y-4">
          {t.nao_e_pra_voce.map((b, i) => (
            <li key={i} className="flex gap-3 text-base leading-snug text-texto/90">
              <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-perigo/15 text-sm font-bold text-perigo">
                ✕
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="lista" className="scroll-mt-6">
        <h2 className="mb-2 text-3xl font-black">{t.form_titulo}</h2>
        <p className="mb-6 text-suave">Leva 1 minuto. Os campos com * são obrigatórios.</p>
        <FormularioLista botao={t.botao} />
      </section>

      <footer className="mt-16 border-t border-linha pt-6 text-center text-sm text-suave">
        MDC — Método Demôi de Crescimento · Carlos Henrique Demôi · Cássia-MG
      </footer>
    </main>
  )
}
