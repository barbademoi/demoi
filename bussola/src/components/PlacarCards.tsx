import { corPlacar, comSinal } from '@/lib/feedbacks'

interface DadosPlacar {
  atual: number
  delta: number
}

const CLASSES: Record<string, string> = {
  verde: 'bg-green-50 border-green-200 text-green-700',
  amarelo: 'bg-amber-50 border-amber-200 text-amber-700',
  vermelho: 'bg-red-50 border-red-200 text-red-700',
}

function Card({ titulo, dados }: { titulo: string; dados: DadosPlacar }) {
  const cls = CLASSES[corPlacar(dados.atual)]
  const deltaCor = dados.delta > 0 ? 'text-green-600' : dados.delta < 0 ? 'text-red-600' : 'text-text-muted'
  return (
    <div className={`rounded-2xl border p-4 text-center ${cls}`}>
      <p className="text-xs font-medium opacity-80">{titulo}</p>
      <p className="text-3xl font-bold mt-1">{comSinal(dados.atual)}</p>
      <p className={`text-xs mt-1 ${deltaCor}`}>{comSinal(dados.delta)} vs anterior</p>
    </div>
  )
}

export default function PlacarCards({
  semana,
  mes,
  ano,
}: {
  semana: DadosPlacar
  mes: DadosPlacar
  ano: DadosPlacar
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card titulo="Semana" dados={semana} />
      <Card titulo="Mês" dados={mes} />
      <Card titulo="Ano" dados={ano} />
    </div>
  )
}
