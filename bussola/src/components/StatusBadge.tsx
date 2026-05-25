import type { StatusProfissional } from '@/lib/profissionais'

const MAP: Record<StatusProfissional, { label: string; cls: string }> = {
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  afastado: { label: 'Afastado', cls: 'bg-amber-100 text-amber-700' },
  desligado: { label: 'Desligado', cls: 'bg-gray-200 text-gray-600' },
}

export default function StatusBadge({ status }: { status: StatusProfissional }) {
  const { label, cls } = MAP[status] ?? MAP.ativo
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
