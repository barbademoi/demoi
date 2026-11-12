import type { Metadata } from 'next'
import { Logo } from '@/components/tarefix/Logo'
import { carregarAcesso } from '@/lib/tarefix/sessaoColaborador'
import { montarEstado } from '@/lib/tarefix/estadoHoje'
import { horarioCurto } from '@/lib/tarefix/datas'
import { TelaPin } from './TelaPin'
import { TelaHoje } from './TelaHoje'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Minhas tarefas',
  robots: { index: false, follow: false },
  referrer: 'no-referrer', // o token não vaza em links externos
}

export default async function PaginaColaborador({ params }: { params: { token: string } }) {
  const acesso = await carregarAcesso(params.token)

  if (acesso.estado === 'invalido') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo className="text-5xl" />
        <h1 className="mt-4 text-xl font-extrabold">Este link não funciona mais</h1>
        <p className="text-tf-suave">Ele pode ter sido trocado ou desativado. Peça o link novo para quem cuida da equipe.</p>
      </main>
    )
  }

  if (acesso.estado === 'pin') {
    return <TelaPin token={params.token} nome={acesso.colaborador.nome} fotoUrl={acesso.colaborador.foto_url} empresa={acesso.empresa.nome} />
  }

  const { colaborador, empresa, funcao } = acesso
  const estado = await montarEstado({ colaborador, empresa }, true)

  return (
    <TelaHoje
      token={params.token}
      colaborador={{ nome: colaborador.nome, foto_url: colaborador.foto_url, funcao }}
      empresa={{ nome: empresa.nome, logo_url: empresa.logo_url, fecha: horarioCurto(empresa.horario_fechamento) }}
      inicial={estado}
    />
  )
}
