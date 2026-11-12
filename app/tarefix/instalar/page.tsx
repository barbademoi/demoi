import Link from 'next/link'
import { Logo } from '@/components/tarefix/Logo'
import { estadoInstalacao, SQL_INSTALACAO } from '@/lib/tarefix/instalacao'
import { BotaoCopiar } from './BotaoCopiar'
import { FormDono } from './FormDono'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Instalação' }

function Passo({
  n,
  titulo,
  feito,
  ativo,
  children,
}: {
  n: number
  titulo: string
  feito: boolean
  ativo: boolean
  children?: React.ReactNode
}) {
  return (
    <section className={`tf-cartao p-5 ${ativo ? 'border-tf-marca' : ''} ${!feito && !ativo ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
            feito ? 'bg-tf-marca text-white' : 'bg-tf-marca-clara text-tf-marca'
          }`}
        >
          {feito ? '✓' : n}
        </span>
        <h2 className="text-lg font-extrabold">{titulo}</h2>
      </div>
      {ativo && children && <div className="mt-4 space-y-4 text-[15px] leading-relaxed">{children}</div>}
    </section>
  )
}

function LinkExterno({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <b>{children}</b>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-bold text-tf-marca underline">
      {children}
    </a>
  )
}

export default async function Instalar() {
  const e = await estadoInstalacao()
  const passo = !e.variaveisOk || e.conexaoErro ? 1 : !e.sqlRodou ? 2 : !e.schemaExposto ? 3 : !e.temDono ? 4 : 5

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <Logo className="text-4xl" />
      <h1 className="pt-2 text-2xl font-extrabold">Instalação</h1>
      <p className="text-tf-suave">
        O Tarefix usa o mesmo Supabase do BarberMeta, num espaço separado (schema <b>tarefix</b>). Nada do BarberMeta é tocado.
        Esta página confere cada passo sozinha.
      </p>

      <Passo n={1} titulo="Conexão com o Supabase" feito={passo > 1} ativo={passo === 1}>
        {!e.variaveisOk ? (
          <p>
            As chaves do Supabase não estão configuradas neste site. Elas são as mesmas do BarberMeta (
            <code className="text-sm">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{' '}
            <code className="text-sm">SUPABASE_SERVICE_ROLE_KEY</code>) e normalmente já existem na Vercel.
          </p>
        ) : (
          <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm">
            <b>O Supabase respondeu com erro:</b> {e.conexaoErro}
          </p>
        )}
        <a href="/tarefix/instalar" className="tf-botao2 w-full">Verificar de novo</a>
      </Passo>

      <Passo n={2} titulo="Criar as tabelas do Tarefix" feito={passo > 2} ativo={passo === 2}>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Toque em <b>Copiar SQL</b>.</li>
          <li>
            Abra o <LinkExterno href={e.linkSqlEditor}>SQL Editor do Supabase</LinkExterno>, cole e clique em <b>Run</b>.
          </li>
          <li>Volte aqui e toque em <b>Verificar</b>.</li>
        </ol>
        <p className="text-sm text-tf-suave">
          Esse SQL só cria coisas novas com o nome &quot;tarefix&quot;. Se algo der errado no meio, ele desfaz tudo sozinho.
        </p>
        <BotaoCopiar texto={SQL_INSTALACAO} rotulo="Copiar SQL" />
        <a href="/tarefix/instalar" className="tf-botao2 w-full">Verificar</a>
      </Passo>

      <Passo n={3} titulo="Liberar o Tarefix na API" feito={passo > 3} ativo={passo === 3}>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Abra as <LinkExterno href={e.linkApiSettings}>configurações de API do Supabase</LinkExterno> (Data API).
          </li>
          <li>
            Em <b>Exposed schemas</b>, adicione <b>tarefix</b> (deixe os que já estão lá).
          </li>
          <li>Clique em <b>Save</b>, espere uns segundos e toque em <b>Verificar</b>.</li>
        </ol>
        <a href="/tarefix/instalar" className="tf-botao2 w-full">Verificar</a>
      </Passo>

      <Passo n={4} titulo="Criar sua conta de dono" feito={passo > 4} ativo={passo === 4}>
        <p className="text-tf-suave">
          Pode usar o mesmo e-mail do BarberMeta (com a mesma senha). Só funciona uma vez: depois da primeira conta, este formulário some.
        </p>
        <FormDono />
      </Passo>

      <Passo n={5} titulo="Pronto!" feito={passo === 5} ativo={passo === 5}>
        <p>Tudo instalado. Confira o diagnóstico completo:</p>
        <Link href="/tarefix/status" className="tf-botao w-full">Ver diagnóstico</Link>
      </Passo>
    </main>
  )
}
