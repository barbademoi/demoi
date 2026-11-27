import Marca from '@/components/Marca'
import Paragrafos from '@/components/Paragrafos'
import { TERMO_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Termo de adesão — MDC' }

export default async function Termo() {
  const t = await lerConfig('termo', TERMO_PADRAO)
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <Marca />
      <h1 className="mt-10 text-3xl font-black">Termo de adesão</h1>
      <p className="mt-1 text-sm text-suave">Versão {t.versao}</p>
      <Paragrafos texto={t.texto} className="mt-8 text-base leading-relaxed text-texto/90" />
    </main>
  )
}
