/** Textos do placar — sem dependências de servidor (pode ir para o navegador). */

type PlacarMin = { feitas: number; total: number; pontos?: number; pontosTotal?: number }

/** "6 de 19 tarefas" — ou "6 de 21 pontos" quando há peso, para o texto bater com o %. */
export function detalhePlacar(p: PlacarMin | null | undefined, rotulo = 'tarefas'): string | undefined {
  if (!p) return undefined
  if (p.pontosTotal !== undefined && p.pontos !== undefined && p.pontosTotal !== p.total) return `${p.pontos} de ${p.pontosTotal} pontos`
  return `${p.feitas} de ${p.total}${rotulo ? ` ${rotulo}` : ''}`
}
