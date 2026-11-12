import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirDono } from '@/lib/tarefix/dono'
import { hojeSP } from '@/lib/tarefix/datas'
import { Avatar } from '@/components/tarefix/ui'
import { DadosColaborador } from './DadosColaborador'
import { AcessoColaborador } from './AcessoColaborador'
import { CalendarioFolgas } from './CalendarioFolgas'
import { StatusColaborador } from './StatusColaborador'

export const metadata = { title: 'Colaborador' }

export default async function Colaborador({ params, searchParams }: { params: { id: string }; searchParams: { novo?: string } }) {
  const { db, empresa } = await exigirDono()
  const { data: c } = await db
    .from('colaboradores')
    .select('id, nome, foto_url, funcao_id, ativo, token_acesso, pin_bloqueado_ate, criado_em')
    .eq('id', params.id)
    .maybeSingle()
  if (!c) notFound()

  const [{ data: funcoes }, { data: folgas }, { count: qtdTarefas }] = await Promise.all([
    db.from('funcoes').select('id, nome, ativo').order('nome'),
    db.from('folgas').select('data').eq('colaborador_id', c.id),
    db.from('tarefas_modelo').select('*', { count: 'exact', head: true }).eq('colaborador_id', c.id).eq('ativo', true),
  ])

  const bloqueado = c.pin_bloqueado_ate && new Date(c.pin_bloqueado_ate) > new Date()

  return (
    <div className="space-y-5">
      <Link href="/tarefix/painel/colaboradores" className="inline-flex min-h-[44px] items-center text-sm font-bold text-tf-suave">
        ‹ Equipe
      </Link>

      <div className="flex items-center gap-4">
        <Avatar nome={c.nome} url={c.foto_url} tamanho={64} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{c.nome}</h1>
          <p className="text-tf-suave">{c.ativo ? 'Ativo' : 'Desativado — o link não funciona'}</p>
        </div>
      </div>

      {searchParams.novo && (
        <p className="tf-cartao !border-tf-marca p-4 text-sm">
          <b>Cadastrado!</b> Agora mande o link para {c.nome.split(' ')[0]} e passe o PIN pessoalmente. Depois, monte as tarefas.
        </p>
      )}

      <section className="tf-cartao space-y-4 p-5">
        <h2 className="text-lg font-extrabold">Acesso</h2>
        {bloqueado && (
          <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm font-bold">
            Bloqueado por 5 minutos após PINs errados. Trocar o PIN desbloqueia na hora.
          </p>
        )}
        <AcessoColaborador id={c.id} nome={c.nome} token={c.token_acesso} ativo={c.ativo} />
      </section>

      <section className="tf-cartao space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold">Tarefas</h2>
          <Link href={`/tarefix/painel/tarefas?c=${c.id}`} className="tf-botao2 min-h-[44px] px-4 text-sm">
            Editar tarefas
          </Link>
        </div>
        <p className="text-tf-suave">
          {qtdTarefas ? `${qtdTarefas} tarefa${qtdTarefas > 1 ? 's' : ''} recorrente${qtdTarefas > 1 ? 's' : ''} ativa${qtdTarefas > 1 ? 's' : ''}.` : 'Nenhuma tarefa recorrente ainda.'}
        </p>
      </section>

      <section className="tf-cartao space-y-4 p-5">
        <h2 className="text-lg font-extrabold">Dados</h2>
        <DadosColaborador
          empresaId={empresa.id}
          colaborador={{ id: c.id, nome: c.nome, funcao_id: c.funcao_id, foto_url: c.foto_url }}
          funcoes={funcoes ?? []}
        />
      </section>

      <section className="tf-cartao space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Folgas</h2>
        <p className="text-sm text-tf-suave">Toque nos dias de folga. Nesses dias não há tarefas e o dia não conta no mês.</p>
        <CalendarioFolgas colaboradorId={c.id} folgas={(folgas ?? []).map((f) => f.data)} hoje={hojeSP()} />
      </section>

      <section className="tf-cartao p-5">
        <StatusColaborador id={c.id} nome={c.nome} ativo={c.ativo} />
      </section>
    </div>
  )
}
