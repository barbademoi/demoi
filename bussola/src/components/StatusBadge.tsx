import type { StatusProfissional } from '@/lib/profissionais'

const MAP: Record<StatusProfissional, { label: string; cls: string }> = {
  ativo: { label: 'Ativo', cls: 'bg-verde-musgo/10 text-verde-musgo' },
  afastado: { label: 'Afastado', cls: 'bg-ambar/10 text-ambar' },
  desligado: { label: 'Desligado', cls: 'bg-linho text-grafite' },
}

export default function StatusBadge({ status }: { status: StatusProfissional }) {
  const { label, cls } = MAP[status] ?? MAP.ativo
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
