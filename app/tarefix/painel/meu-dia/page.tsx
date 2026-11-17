import { exigirDono } from '@/lib/tarefix/dono'
import { empresaPessoal, garantirEu } from '@/lib/tarefix/meuDia'
import { montarEstado } from '@/lib/tarefix/estadoHoje'
import { horarioCurto } from '@/lib/tarefix/datas'
import { TelaHoje } from '@/app/tarefix/c/[token]/TelaHoje'
import { caminhoAgenda } from '@/lib/tarefix/agenda'

export const metadata = { title: 'Meu dia' }
export const dynamic = 'force-dynamic'

export default async function MeuDia() {
  const { dono, empresa } = await exigirDono()
  const eu = await garantirEu(dono, empresa)
  const emp = empresaPessoal(empresa)
  const estado = await montarEstado({ colaborador: eu, empresa: emp }, true)
  return (
    <div className="-mx-4 -mt-5 lg:-mx-8 lg:-mt-10">
      <TelaHoje
        token={eu.token_acesso}
        colaborador={{ nome: dono.nome, foto_url: eu.foto_url, funcao: null }}
        empresa={{ nome: empresa.nome, logo_url: null, fecha: horarioCurto(emp.horario_fechamento), fechaHorario: emp.horario_fechamento }}
        inicial={estado}
        linkTarefas={`/tarefix/painel/tarefas?c=${eu.id}`}
        agenda={caminhoAgenda(eu)}
      />
    </div>
  )
}
