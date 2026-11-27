import Marca from '@/components/Marca'
import { LANDING_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Você está na lista — MDC', robots: { index: false } }

export default async function Pronto() {
  const [t, grupo] = await Promise.all([lerConfig('landing', LANDING_PADRAO), lerConfig('grupo_espera_url', '')])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-12 pt-6 sm:px-6">
      <Marca />
      <div className="flex flex-1 flex-col justify-center py-12 text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-ok/15 text-4xl text-ok" aria-hidden>
          ✓
        </div>
        <h1 className="text-4xl font-black leading-tight">{t.confirmacao_titulo}</h1>
        <p className="mt-5 text-lg text-suave">{t.confirmacao_texto}</p>
        {grupo ? (
          <a href={grupo} target="_blank" rel="noopener noreferrer" className="btn-whats mt-10 w-full sm:w-full">
            {t.confirmacao_botao}
          </a>
        ) : (
          <p className="mt-10 rounded-xl border border-linha p-4 text-suave">
            O link do grupo sai em breve. A gente te chama no WhatsApp.
          </p>
        )}
      </div>
    </main>
  )
}
