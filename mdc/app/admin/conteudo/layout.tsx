import Link from 'next/link'

const ABAS = [
  { href: '/admin/conteudo/encontros', rotulo: 'Encontros' },
  { href: '/admin/conteudo/missoes', rotulo: 'Modelos de missão' },
  { href: '/admin/conteudo/kit', rotulo: 'Kit Demôi' },
  { href: '/admin/conteudo/ciclo', rotulo: 'Ciclo de 13 temas' },
]

export default function ConteudoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-3 text-2xl font-black">Conteúdo</h1>
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ABAS.map((a) => (
          <Link key={a.href} href={a.href} className="btn-sm shrink-0 border border-linha text-suave hover:text-texto">
            {a.rotulo}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
