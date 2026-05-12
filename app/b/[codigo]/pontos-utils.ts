import type { CampanhaServico, ControleDiario } from '@/types/database'

function labelData(iso: string): string {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (iso === hoje) return 'Hoje'
  if (iso === ontem) return 'Ontem'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function computeHistorico(
  controles: Pick<ControleDiario, 'data' | 'servico_id' | 'quantidade'>[],
  servicos: CampanhaServico[],
): { data: string; pontos: number; label: string }[] {
  const map: Record<string, number> = {}
  for (const cd of controles) {
    const pts = servicos.find(s => s.id === cd.servico_id)?.pontos ?? 0
    map[cd.data] = (map[cd.data] ?? 0) + cd.quantidade * pts
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([data, pontos]) => ({ data, pontos, label: labelData(data) }))
}
