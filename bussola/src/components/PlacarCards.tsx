import { corPlacar, comSinal } from '@/lib/feedbacks'

interface DadosPlacar {
  atual: number
  delta: number
}

const CLASSES: Record<string, string> = {
  verde: 'border-l-verde-musgo text-verde-musgo',
  amarelo: 'border-l-marrom text-grafite',
  vermelho: 'border-l-vinho text-vinho',
}

function Card({ titulo, dados }: { titulo: string; dados: DadosPlacar }) {
  const cls = CLASSES[corPlacar(dados.atual)]
  const deltaCor = dados.delta > 0 ? 'text-verde-musgo' : dados.delta < 0 ? 'text-vinho' : 'text-chumbo'
  return (
    <div className={`rounded-md border border-border bg-surface border-l-[3px] p-4 text-center ${cls}`}>
      <p className="text-xs font-medium text-chumbo">{titulo}</p>
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
