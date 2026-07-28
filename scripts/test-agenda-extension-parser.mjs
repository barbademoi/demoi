import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const codigo = fs.readFileSync(
  new URL('../chrome-extension-agenda/report-parser.js', import.meta.url),
  'utf8',
)

const contexto = vm.createContext({
  console,
})
vm.runInContext(codigo, contexto)

function celula(texto) {
  return {
    innerText: texto,
    textContent: texto,
  }
}

function linha(...textos) {
  const celulas = textos.map(celula)
  return {
    querySelectorAll(seletor) {
      assert.equal(seletor, 'th, td')
      return celulas
    },
  }
}

function tabela(linhas) {
  return {
    querySelectorAll(seletor) {
      assert.equal(seletor, 'tr')
      return linhas
    },
  }
}

function documento({ texto, tabelas = [] }) {
  const elementos = []
  return {
    title: 'Agenda Serviço — Relatório',
    body: {
      innerText: texto,
      querySelectorAll() {
        return elementos
      },
    },
    documentElement: { innerText: texto },
    querySelector() {
      return null
    },
    querySelectorAll(seletor) {
      if (seletor === 'table') return tabelas
      return []
    },
  }
}

function elementoLayout(texto, left, top, width = 80, height = 30) {
  return {
    innerText: texto,
    textContent: texto,
    childNodes: [{ nodeType: 3, textContent: texto }],
    children: [],
    getBoundingClientRect() {
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
      }
    },
  }
}

function documentoVisual({ texto, elementos }) {
  return {
    title: 'Agenda Serviço — Relatório',
    body: {
      innerText: texto,
      querySelectorAll() {
        return elementos
      },
    },
    documentElement: { innerText: texto },
    defaultView: {
      getComputedStyle() {
        return {
          display: 'block',
          visibility: 'visible',
          opacity: '1',
        }
      },
    },
    querySelector() {
      return null
    },
    querySelectorAll(seletor) {
      if (seletor === 'table') return []
      return []
    },
  }
}

const gradeReal = tabela([
  linha('Total detalhado', 'Casa', 'Zé', 'Caíque'),
  linha('Serviços', 'R$ 10.000,00', 'R$ 4.000,00', 'R$ 3.000,00'),
  linha('Produtos', 'R$ 1.000,00', 'R$ 500,00', 'R$ 200,00'),
  linha('Assinaturas', 'R$ 2.000,00', 'R$ 1.500,00', 'R$ 800,00'),
  linha('Total', 'R$ 13.000,00', 'R$ 6.000,00', 'R$ 4.000,00'),
  linha('Comissões', 'R$ 6.500,00', 'R$ 3.000,00', 'R$ 2.000,00'),
])

const resultadoGrade = contexto.AgendaReportParser.parseDocument(documento({
  texto: 'Agenda Serviço\n01/07/2026 - 28/07/2026\nTotal detalhado',
  tabelas: [gradeReal],
}))
assert.equal(resultadoGrade.ok, true)
assert.equal(resultadoGrade.leitura.periodoInicio, '2026-07-01')
assert.equal(resultadoGrade.leitura.periodoFim, '2026-07-28')
assert.deepEqual(
  Array.from(
    resultadoGrade.leitura.profissionais,
    profissional => ({
      nome: profissional.nomeRelatorio,
      faturamento: profissional.faturamentoAcumulado,
      comissao: profissional.comissaoAcumulada,
    }),
  ),
  [
    { nome: 'Zé', faturamento: 6000, comissao: 3000 },
    { nome: 'Caíque', faturamento: 4000, comissao: 2000 },
  ],
)

const resultadoVisual = contexto.AgendaReportParser.parseDocument(documento({
  texto: [
    'Agenda Serviço',
    '01/07/2026 - 28/07/2026',
    'Total detalhado',
    'Zé',
    'Caíque',
    'Serviços',
    'R$ 4.000,00',
    'R$ 3.000,00',
    'Produtos',
    'R$ 500,00',
    'R$ 200,00',
    'Assinaturas',
    'R$ 1.500,00',
    'R$ 800,00',
    'Total',
    'R$ 6.000,00',
    'R$ 4.000,00',
    'Comissões',
    'R$ 3.000,00',
    'R$ 2.000,00',
  ].join('\n'),
}))
assert.equal(resultadoVisual.ok, true)
assert.equal(resultadoVisual.leitura.periodoFim, '2026-07-28')
assert.equal(resultadoVisual.leitura.profissionais.length, 2)

const resultadoLayout = contexto.AgendaReportParser.parseDocument(
  documentoVisual({
    texto:
      'Agenda Serviço 01/07/2026 - 28/07/2026 Total detalhado Zé Caíque',
    elementos: [
      elementoLayout('Total detalhado', 20, 100, 180, 60),
      elementoLayout('Zé', 250, 125),
      elementoLayout('Caíque', 370, 125),
      elementoLayout('Serviços', 40, 200, 140, 50),
      elementoLayout('R$ 4.000,00', 240, 200, 100, 50),
      elementoLayout('R$ 3.000,00', 360, 200, 100, 50),
      elementoLayout('Produtos', 40, 260, 140, 50),
      elementoLayout('R$ 500,00', 240, 260, 100, 50),
      elementoLayout('R$ 200,00', 360, 260, 100, 50),
      elementoLayout('Assinaturas', 40, 320, 140, 50),
      elementoLayout('R$ 1.500,00', 240, 320, 100, 50),
      elementoLayout('R$ 800,00', 360, 320, 100, 50),
      elementoLayout('Total', 40, 380, 140, 50),
      elementoLayout('R$ 6.000,00', 240, 380, 100, 50),
      elementoLayout('R$ 4.000,00', 360, 380, 100, 50),
      elementoLayout('Comissões', 40, 440, 140, 50),
      elementoLayout('R$ 3.000,00', 240, 440, 100, 50),
      elementoLayout('R$ 2.000,00', 360, 440, 100, 50),
    ],
  }),
)
assert.equal(resultadoLayout.ok, true)
assert.equal(resultadoLayout.leitura.periodoFim, '2026-07-28')
assert.deepEqual(
  Array.from(
    resultadoLayout.leitura.profissionais,
    profissional => profissional.nomeRelatorio,
  ),
  ['Zé', 'Caíque'],
)

console.log('Leitor da extensão validado no formato real do Agenda Serviço.')
