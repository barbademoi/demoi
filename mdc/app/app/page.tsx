import { requireMembro } from '@/lib/membro'
import { dataBR } from '@/lib/format'

export default async function Inicio() {
  const { membro, semana } = await requireMembro()
  return (
    <div className="card p-6">
      <h1 className="text-3xl font-black">Acesso liberado, {membro.nome.split(' ')[0]}!</h1>
      <p className="mt-3 text-lg text-suave">
        {semana > 0 ? `Você está na semana ${semana}.` : `Sua jornada começa em ${dataBR(membro.data_inicio)}.`} Seu plano vale até {dataBR(membro.vencimento)}.
      </p>
    </div>
  )
}
