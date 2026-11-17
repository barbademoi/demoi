import type { Metadata } from 'next'
import { Logo } from '@/components/tarefix/Logo'
import { mentoradoPorToken, montarTelaMentoria } from '@/lib/tarefix/mentoria'
import { hojeSP } from '@/lib/tarefix/datas'
import { TelaMentoria } from './TelaMentoria'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { token: string } }): Metadata {
  return {
    title: 'Minha mentoria',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
    manifest: `/tarefix/m/${params.token}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: 'Mentoria', statusBarStyle: 'default' },
  }
}

export default async function PaginaMentoria({ params }: { params: { token: string } }) {
  const m = await mentoradoPorToken(params.token)
  if (!m) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo className="text-5xl" />
        <h1 className="mt-4 text-xl font-extrabold">Este link não funciona mais</h1>
        <p className="text-tf-suave">Ele pode ter sido trocado. Peça o link novo ao seu mentor.</p>
      </main>
    )
  }
  const estado = await montarTelaMentoria(m)
  return <TelaMentoria token={params.token} nome={m.nome} inicial={estado} hoje={hojeSP()} />
}
