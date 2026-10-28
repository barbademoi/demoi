/**
 * FERIADOS NACIONAIS BRASILEIROS — calculados aqui, sem rede e sem API.
 *
 * Existem porque o sistema estava acusando a barbearia de "dias sem registro"
 * em datas que ela estava legitimamente fechada. Domingo o próprio cadastro já
 * resolvia (`barbearias.dias_trabalhados`); feriado, não — ninguém cadastra
 * 12 de outubro todo ano.
 *
 * ── FIXOS x MÓVEIS ──────────────────────────────────────────────────────────
 * Os fixos são data de calendário. Os móveis dependem da PÁSCOA, que não tem
 * fórmula simples: é o primeiro domingo depois da primeira lua cheia após o
 * equinócio de março. O algoritmo abaixo (Meeus/Jones/Butcher, gregoriano) dá
 * a data exata para qualquer ano, e é a mesma conta que qualquer calendário
 * usa — não há nada a buscar na internet.
 *
 * ── FERIADO x PONTO FACULTATIVO ─────────────────────────────────────────────
 * Carnaval e Corpus Christi NÃO são feriados nacionais por lei — são pontos
 * facultativos. Mas barbearia fecha. Eles entram marcados como `facultativo`
 * para a tela poder sugerir sem afirmar que é obrigatório, e para o dono ter a
 * palavra final.
 *
 * 20 de novembro (Consciência Negra) virou feriado nacional pela Lei
 * 14.759/2023 — vale de 2024 em diante, e antes disso não.
 */

export interface Feriado {
  /** 'YYYY-MM-DD' */
  data: string
  nome: string
  /** false = feriado nacional por lei; true = ponto facultativo (Carnaval…). */
  facultativo: boolean
}

const iso = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

/**
 * Domingo de Páscoa do ano (algoritmo gregoriano anônimo).
 * Devolve [mes, dia].
 */
export function domingoDePascoa(ano: number): [number, number] {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return [mes, dia]
}

/** Soma dias a uma data, devolvendo 'YYYY-MM-DD'. Meio-dia evita fuso. */
function somarDias(ano: number, mes: number, dia: number, delta: number): string {
  const d = new Date(ano, mes - 1, dia, 12, 0, 0)
  d.setDate(d.getDate() + delta)
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function feriadosDoAno(ano: number): Feriado[] {
  const [mp, dp] = domingoDePascoa(ano)

  const lista: Feriado[] = [
    { data: iso(ano, 1, 1), nome: 'Confraternização Universal', facultativo: false },
    { data: iso(ano, 4, 21), nome: 'Tiradentes', facultativo: false },
    { data: iso(ano, 5, 1), nome: 'Dia do Trabalho', facultativo: false },
    { data: iso(ano, 9, 7), nome: 'Independência', facultativo: false },
    { data: iso(ano, 10, 12), nome: 'Nossa Senhora Aparecida', facultativo: false },
    { data: iso(ano, 11, 2), nome: 'Finados', facultativo: false },
    { data: iso(ano, 11, 15), nome: 'Proclamação da República', facultativo: false },
    { data: iso(ano, 12, 25), nome: 'Natal', facultativo: false },

    // Móveis, contados a partir do Domingo de Páscoa.
    { data: somarDias(ano, mp, dp, -48), nome: 'Carnaval', facultativo: true },
    { data: somarDias(ano, mp, dp, -47), nome: 'Carnaval (terça)', facultativo: true },
    { data: somarDias(ano, mp, dp, -46), nome: 'Quarta-feira de Cinzas', facultativo: true },
    { data: somarDias(ano, mp, dp, -2), nome: 'Sexta-feira Santa', facultativo: false },
    { data: somarDias(ano, mp, dp, 60), nome: 'Corpus Christi', facultativo: true },
  ]

  // Lei 14.759/2023 — nacional só a partir de 2024.
  if (ano >= 2024) {
    lista.push({ data: iso(ano, 11, 20), nome: 'Consciência Negra', facultativo: false })
  }

  return lista.sort((a, b) => a.data.localeCompare(b.data))
}

/** Mapa data → feriado, cobrindo os anos que o intervalo tocar. */
export function feriadosNoIntervalo(inicioIso: string, fimIso: string): Map<string, Feriado> {
  const anoIni = Number(inicioIso.slice(0, 4))
  const anoFim = Number(fimIso.slice(0, 4))
  const mapa = new Map<string, Feriado>()
  for (let ano = anoIni; ano <= anoFim; ano++) {
    for (const f of feriadosDoAno(ano)) {
      if (f.data >= inicioIso && f.data <= fimIso) mapa.set(f.data, f)
    }
  }
  return mapa
}
