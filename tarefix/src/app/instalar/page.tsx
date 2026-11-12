import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { estadoInstalacao, SQL_INSTALACAO } from '@/lib/instalacao'
import { BotaoCopiar } from './BotaoCopiar'
import { FormDono } from './FormDono'

export const dynamic = 'force-dynamic'

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
    <section className={`cartao p-5 ${ativo ? 'border-marca' : ''} ${!feito && !ativo ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
            feito ? 'bg-marca text-white' : 'bg-marca-clara text-marca'
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

export default async function Instalar() {
  const e = await estadoInstalacao()
  const passo = !e.variaveisOk || e.conexaoErro ? 1 : !e.bancoOk ? 2 : !e.temDono ? 3 : 4

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <Logo className="text-4xl" />
      <h1 className="pt-2 text-2xl font-extrabold">Instalação</h1>
      <p className="text-suave">Tudo pelo navegador. Esta página confere cada passo sozinha.</p>

      <Passo n={1} titulo="Chaves do Supabase na Vercel" feito={passo > 1} ativo={passo === 1}>
        <p>
          No Supabase, abra <b>Project Settings → API</b> e copie os valores abaixo. Na Vercel, abra o projeto do Tarefix em{' '}
          <b>Settings → Environment Variables</b>, adicione cada um e depois faça <b>Redeploy</b>.
        </p>
        <ul className="space-y-2">
          {e.variaveis.map((v) => (
            <li key={v.nome} className="flex items-start gap-2">
              <span className={`font-extrabold ${v.ok ? 'text-marca' : 'text-suave'}`}>{v.ok ? '✓' : '○'}</span>
              <span>
                <code className="break-all text-sm font-bold">{v.nome}</code>
                <span className="block text-sm text-suave">{v.ondeAchar}</span>
              </span>
            </li>
          ))}
        </ul>
        {e.conexaoErro && (
          <p className="rounded-xl bg-marca-clara px-4 py-3 text-sm">
            <b>As chaves estão lá, mas o Supabase recusou:</b> {e.conexaoErro}. Confira se copiou a URL e a chave service_role certas.
          </p>
        )}
      </Passo>

      <Passo n={2} titulo="Criar as tabelas" feito={passo > 2} ativo={passo === 2}>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Toque em <b>Copiar SQL</b>.</li>
          <li>
            Abra o{' '}
            {e.linkSqlEditor ? (
              <a href={e.linkSqlEditor} target="_blank" rel="noreferrer" className="font-bold text-marca underline">
                SQL Editor do seu projeto
              </a>
            ) : (
              <b>SQL Editor</b>
            )}
            , cole e clique em <b>Run</b>.
          </li>
          <li>Volte aqui e toque em <b>Verificar</b>.</li>
        </ol>
        <BotaoCopiar texto={SQL_INSTALACAO} rotulo="Copiar SQL" />
        <a href="/instalar" className="botao-secundario w-full">Verificar</a>
      </Passo>

      <Passo n={3} titulo="Criar sua conta de dono" feito={passo > 3} ativo={passo === 3}>
        <p className="text-suave">Só funciona uma vez: depois que a primeira conta é criada, este formulário some.</p>
        <FormDono />
      </Passo>

      <Passo n={4} titulo="Pronto!" feito={passo === 4} ativo={passo === 4}>
        <p>Tudo instalado. Confira o diagnóstico completo:</p>
        <Link href="/status" className="botao w-full">Ver diagnóstico</Link>
        <p className="text-sm text-suave">
          Recomendado: no Supabase, em <b>Authentication → Sign In / Providers</b>, desligue <b>Allow new users to sign up</b>.
        </p>
      </Passo>
    </main>
  )
}
