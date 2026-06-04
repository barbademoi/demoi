import Link from 'next/link'

export function RodapeMarketing() {
  return (
    <footer className="px-4 py-12 bg-background">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-8 w-auto" />
          <p className="text-sm text-chumbo italic">A bússola que faltava na sua liderança.</p>
        </div>
        <div className="space-y-2 text-sm text-grafite">
          <p className="font-semibold text-text mb-2">Links</p>
          <p><Link href="/termos" className="hover:text-marrom">Termos de uso</Link></p>
          <p><Link href="/privacidade" className="hover:text-marrom">Política de privacidade</Link></p>
          <p><a href="mailto:contato@bussolameet.com.br" className="hover:text-marrom">Contato</a></p>
        </div>
        <div className="text-sm text-grafite">
          <p className="font-semibold text-text mb-2">Sobre</p>
          <p>
            A Bússola é uma ferramenta de gestão criada por Carlos Henrique,
            fundador da Demôi Barbearia em Cássia/MG.
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-chumbo">
        <p>© 2026 Bússola · <a href="https://bussolameet.com.br" className="hover:text-marrom">bussolameet.com.br</a></p>
        <p>
          Já é cliente? <Link href="/entrar" className="hover:text-marrom underline">Entrar</Link>
        </p>
      </div>
    </footer>
  )
}
