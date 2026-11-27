import { somarDias } from '@/lib/format'

export type Modelo = {
  id: string
  perfil: string
  semana: number
  tipo: 'habito_diario' | 'missao_semana'
  titulo: string
  descricao: string | null
  kit_material_id: string | null
  ordem: number
}
export type Registro = { id: string; template_id: string; dia: string | null; semana: number; observacao: string | null }

/** Primeiro dia da semana N do membro. */
export function inicioDaSemana(dataInicio: string, semana: number) {
  return somarDias(dataInicio, (semana - 1) * 7)
}

/** Hábitos que valem numa semana (acumulativos). */
export function habitosDaSemana(modelos: Modelo[], semana: number) {
  return modelos.filter((m) => m.tipo === 'habito_diario' && m.semana <= semana).sort((a, b) => a.semana - b.semana || a.ordem - b.ordem)
}

export function missoesDaSemana(modelos: Modelo[], semana: number) {
  return modelos.filter((m) => m.tipo === 'missao_semana' && m.semana === semana).sort((a, b) => a.ordem - b.ordem)
}

/**
 * Resumo de uma semana já fechada (mesma regra do banco: itens marcados ÷
 * previstos). Usado no histórico.
 */
export function resumoSemana(modelos: Modelo[], registros: Registro[], dataInicio: string, semana: number, ate?: string) {
  const ini = inicioDaSemana(dataInicio, semana)
  const habitos = habitosDaSemana(modelos, semana)
  const missoes = missoesDaSemana(modelos, semana)
  let previstos = missoes.length
  let feitos = 0
  for (let i = 0; i < 7; i++) {
    const dia = somarDias(ini, i)
    if (ate && dia > ate) break
    previstos += habitos.length
    feitos += habitos.filter((h) => registros.some((r) => r.template_id === h.id && r.dia === dia)).length
  }
  const missoesFeitas = missoes.filter((m) => registros.some((r) => r.template_id === m.id && r.dia === null && r.semana === semana))
  feitos += missoesFeitas.length
  return { previstos, feitos, pct: previstos ? Math.min(100, Math.round((feitos * 100) / previstos)) : 0, missoes, missoesFeitas }
}
