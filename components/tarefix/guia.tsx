import Link from 'next/link'

/* Blocos visuais do guia "Como usar" (dono e equipe). */

export function Indice({ itens }: { itens: { id: string; titulo: string }[] }) {
  return (
    <nav aria-label="Índice" className="tf-cartao p-4">
      <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-tf-suave">Neste guia</p>
      <ol className="grid gap-1 sm:grid-cols-2">
        {itens.map((i, n) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="flex min-h-[40px] items-center gap-3 rounded-xl px-2 font-bold hover:bg-tf-marca-clara/60">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tf-marca-clara text-xs font-extrabold text-tf-marca-texto">{n + 1}</span>
              {i.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Secao({ id, numero, titulo, resumo, children }: { id: string; numero: number; titulo: string; resumo?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tf-marca text-lg font-black text-white">{numero}</span>
        <div>
          <h2 className="text-xl font-extrabold leading-tight tracking-tight">{titulo}</h2>
          {resumo && <p className="text-tf-suave">{resumo}</p>}
        </div>
      </div>
      <div className="space-y-4 leading-relaxed">{children}</div>
    </section>
  )
}

/** Passo numerado (lista ordenada com bolinhas). */
export function Passos({ children }: { children: React.ReactNode }) {
  return <ol className="tf-cartao tf-passos divide-y divide-tf-borda">{children}</ol>
}

export function Passo({ titulo, children, href, botao }: { titulo: string; children?: React.ReactNode; href?: string; botao?: string }) {
  return (
    <li className="flex gap-4 px-5 py-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-tf-marca text-sm font-extrabold text-tf-marca-texto tf-passo-num" aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-extrabold">{titulo}</p>
        {children && <div className="space-y-2 text-tf-texto/90">{children}</div>}
        {href && (
          <Link href={href} className="inline-flex min-h-[40px] items-center rounded-full bg-tf-marca-clara px-4 text-sm font-bold text-tf-marca-texto">
            {botao ?? 'Abrir'} ›
          </Link>
        )}
      </div>
    </li>
  )
}

export function Exemplo({ titulo = 'Exemplo real', children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-l-4 border-tf-marca bg-tf-marca-clara/60 px-4 py-3">
      <p className="mb-1 text-sm font-extrabold uppercase tracking-wide text-tf-marca-texto">{titulo}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function Dicao({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-tf-borda bg-tf-card px-4 py-3">
      <span className="text-xl leading-none" aria-hidden>💡</span>
      <div className="space-y-1">
        <p className="text-sm font-extrabold uppercase tracking-wide text-tf-suave">Dica</p>
        {children}
      </div>
    </div>
  )
}

export function Cuidado({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-tf-texto px-4 py-3 text-tf-fundo">
      <span className="text-xl leading-none" aria-hidden>⚠️</span>
      <div className="space-y-1">
        <p className="text-sm font-extrabold uppercase tracking-wide opacity-80">Atenção</p>
        {children}
      </div>
    </div>
  )
}

/** Comparação "assim não / assim sim". */
export function AssimSim({ linhas }: { linhas: [string, string][] }) {
  return (
    <div className="tf-cartao overflow-hidden">
      <div className="grid grid-cols-2 border-b border-tf-borda text-sm font-extrabold">
        <p className="px-4 py-2 text-tf-suave">✗ Assim não</p>
        <p className="border-l border-tf-borda px-4 py-2 text-tf-marca-texto">✓ Assim sim</p>
      </div>
      {linhas.map(([nao, sim], i) => (
        <div key={i} className="grid grid-cols-2 border-b border-tf-borda text-sm last:border-0">
          <p className="px-4 py-3 text-tf-suave line-through decoration-tf-suave/40">{nao}</p>
          <p className="border-l border-tf-borda px-4 py-3 font-bold">{sim}</p>
        </div>
      ))}
    </div>
  )
}

/** Tabela: no computador, tabela; no celular, um cartão por linha (nada cortado). */
export function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: React.ReactNode[][] }) {
  return (
    <>
      <div className="tf-cartao hidden overflow-hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-tf-borda text-tf-suave">
              {cabecalho.map((c) => (
                <th key={c} className="px-4 py-2 font-extrabold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-tf-borda last:border-0">
                {l.map((c, j) => (
                  <td key={j} className={`px-4 py-3 align-top ${j === 0 ? 'font-bold' : ''}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="tf-cartao divide-y divide-tf-borda sm:hidden">
        {linhas.map((l, i) => (
          <li key={i} className="space-y-1 px-4 py-3 text-sm">
            <p className="text-base font-extrabold">{l[0]}</p>
            {l.slice(1).map((c, j) => (
              <p key={j}>
                <span className="font-bold text-tf-suave">{cabecalho[j + 1]}: </span>
                {c}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Pergunta frequente que abre e fecha. */
export function Pergunta({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-tf-borda last:border-0">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-bold">
        {q}
        <span className="text-xl text-tf-suave transition group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="space-y-2 px-5 pb-4 text-tf-texto/90">{children}</div>
    </details>
  )
}
