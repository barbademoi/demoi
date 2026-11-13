import Link from 'next/link'
import { exigirDono } from '@/lib/tarefix/dono'
import { Titulo } from '@/components/tarefix/ui'
import { ehAdmin } from '@/lib/tarefix/acessos'

export const metadata = { title: 'Mais' }

const LINKS = [
  { href: '/tarefix/painel/historico', titulo: 'Histórico', texto: 'Como foi um dia de cada colaborador' },
  { href: '/tarefix/painel/funcoes', titulo: 'Funções', texto: 'Atendimento, Limpeza, Caixa…' },
  { href: '/tarefix/painel/avisos', titulo: 'Avisos', texto: 'Fechamentos, fotos e extras' },
  { href: '/tarefix/painel/configuracoes', titulo: 'Ajustes', texto: 'Empresa, horário, mensagens, bônus e tema' },
  { href: '/tarefix/painel/como-usar', titulo: 'Como usar', texto: 'Passo a passo com exemplos, dicas e dúvidas' },
]

export default async function Mais() {
  const { userId } = await exigirDono()
  const links = (await ehAdmin(userId))
    ? [...LINKS, { href: '/tarefix/painel/acessos', titulo: 'Mentorados', texto: 'Conceder e suspender acessos ao Tarefix' }]
    : LINKS
  return (
    <>
      <Titulo>Mais</Titulo>
      <ul className="tf-cartao divide-y divide-tf-borda">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-h-[72px] items-center gap-4 px-5 py-4 hover:bg-tf-marca-clara/50">
              <span className="flex-1">
                <span className="block font-bold">{l.titulo}</span>
                <span className="block text-sm text-tf-suave">{l.texto}</span>
              </span>
              <span className="text-xl text-tf-suave" aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
