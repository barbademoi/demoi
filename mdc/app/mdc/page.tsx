/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import Marca from '@/components/Marca'
import Paragrafos from '@/components/Paragrafos'
import { VENDAS_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import { PLANOS } from '@/lib/planos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'MDC — Método Demôi de Crescimento' }

type Depoimento = { id: string; nome: string; local: string | null; texto: string; foto_url: string | null }
type Faq = { id: string; pergunta: string; resposta: string }

export default async function Vendas() {
  const t = await lerConfig('vendas', VENDAS_PADRAO)
  let depoimentos: Depoimento[] = []
  let faqs: Faq[] = []
  try {
    const supabase = createClient()
    const [d, f] = await Promise.all([
      supabase.from('mdc_testimonials').select('id,nome,local,texto,foto_url').eq('ativo', true).order('ordem'),
      supabase.from('mdc_faqs').select('id,pergunta,resposta').eq('ativo', true).order('ordem'),
    ])
    depoimentos = (d.data as Depoimento[]) ?? []
    faqs = (f.data as Faq[]) ?? []
  } catch {
    // sem banco, a página segue sem esses blocos
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
      <header className="mb-10 flex items-center justify-between">
        <Marca href="/mdc" />
        <Link href="/entrar" className="text-sm text-suave hover:text-texto">Já sou membro</Link>
      </header>

      {/* 1. Título e promessa */}
      <section className="mb-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-latao">Mentoria em grupo · MDC</p>
        <h1 className="text-balance text-4xl font-black leading-[1.08] sm:text-5xl">{t.titulo}</h1>
        <Paragrafos texto={t.promessa} className="mt-5 text-lg text-suave sm:text-xl" />
        <a href="#planos" className="btn-primario mt-8">{t.botao}</a>
      </section>

      {/* 2. Para quem é */}
      <Secao titulo={t.para_quem_titulo}>
        <Lista itens={t.para_quem} />
      </Secao>

      {/* 3. Pilares */}
      <Secao titulo={t.pilares_titulo}>
        <Paragrafos texto={t.pilares_texto} className="mb-6 text-lg text-texto/90" />
        <ol className="grid gap-3 sm:grid-cols-2">
          {t.pilares.map((p, i) => (
            <li key={i} className="card flex items-center gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-latao/15 text-lg font-black text-latao">{i + 1}</span>
              <span className="text-lg font-semibold">{p}</span>
            </li>
          ))}
        </ol>
      </Secao>

      {/* 4. Como funciona */}
      <Secao titulo={t.como_funciona_titulo}>
        <Lista itens={t.como_funciona} />
      </Secao>

      {/* 5. Quem é o Carlos */}
      <Secao titulo={t.carlos_titulo}>
        <div className="card overflow-hidden">
          {t.carlos_foto_url && <img src={t.carlos_foto_url} alt="Carlos Henrique Demôi" className="aspect-[4/3] w-full object-cover" />}
          <Paragrafos texto={t.carlos_texto} className="p-6 text-lg text-texto/90" />
        </div>
      </Secao>

      {/* 6. Resultados */}
      {depoimentos.length > 0 && (
        <Secao titulo={t.resultados_titulo}>
          <div className="grid gap-4 sm:grid-cols-2">
            {depoimentos.map((d) => (
              <figure key={d.id} className="card p-5">
                <blockquote className="whitespace-pre-line text-base leading-relaxed">“{d.texto}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  {d.foto_url ? (
                    <img src={d.foto_url} alt={d.nome} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-card-2 font-bold text-latao">{d.nome[0]}</span>
                  )}
                  <span>
                    <span className="block font-bold">{d.nome}</span>
                    {d.local && <span className="block text-sm text-suave">{d.local}</span>}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Secao>
      )}

      {/* 7. Preço */}
      <section id="planos" className="mb-16 scroll-mt-6">
        <h2 className="mb-3 text-3xl font-black">{t.preco_titulo}</h2>
        <Paragrafos texto={t.preco_texto} className="mb-6 text-lg text-suave" />
        <div className="grid gap-4">
          {PLANOS.map((p, i) => (
            <div key={p.id} className={`card p-5 ${i === 0 ? 'border-latao' : ''}`}>
              {i === 0 && <span className="mb-3 inline-block rounded-full bg-latao px-3 py-1 text-xs font-bold text-fundo">Mais escolhido</span>}
              <p className="text-lg font-bold">{p.nome}</p>
              <p className="mt-1 text-3xl font-black">{p.destaque}</p>
              <p className="mt-1 text-suave">{p.detalhe}</p>
              <Link href={`/comprar?plano=${p.id}`} className={`${i === 0 ? 'btn-primario' : 'btn-secundario'} mt-5 w-full sm:w-full`}>
                Escolher este plano
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ */}
      {faqs.length > 0 && (
        <Secao titulo={t.faq_titulo}>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.id} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.pergunta}
                  <span className="text-2xl text-latao transition group-open:rotate-45">+</span>
                </summary>
                <Paragrafos texto={f.resposta} className="mt-3 text-texto/85" />
              </details>
            ))}
          </div>
        </Secao>
      )}

      {/* 9. Botão de compra */}
      <section className="card p-6 text-center">
        <h2 className="text-3xl font-black">{t.final_titulo}</h2>
        <Paragrafos texto={t.final_texto} className="mt-3 text-lg text-suave" />
        <Link href="/comprar" className="btn-primario mt-6 w-full sm:w-full">{t.botao}</Link>
      </section>

      {/* barra fixa no celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-fundo/95 p-3 backdrop-blur sm:hidden">
        <a href="#planos" className="btn-primario">{t.botao}</a>
      </div>
    </main>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="mb-6 text-3xl font-black">{titulo}</h2>
      {children}
    </section>
  )
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-4">
      {itens.map((b, i) => (
        <li key={i} className="flex gap-3 text-lg leading-snug">
          <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-latao/15 text-sm font-bold text-latao">✓</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}
