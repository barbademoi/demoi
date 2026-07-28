(() => {
  'use strict'

  const LABELS = {
    servicosAcumulado: ['servicos', 'total de servicos'],
    produtosAcumulado: ['produtos', 'total de produtos'],
    assinaturasAcumulado: ['assinaturas', 'total de assinaturas'],
    faturamentoAcumulado: [
      'rendimento total bruto',
      'faturamento bruto',
      'total bruto',
      'total',
    ],
    comissaoAcumulada: [
      'total em comissoes',
      'total de comissoes',
      'comissao total',
      'comissoes',
      'comissao',
    ],
  }

  const CABECALHOS_DETALHADOS = [
    'total detalhado',
    'faturamento detalhado',
    'detalhamento por profissional',
  ]

  function normalizar(texto) {
    return String(texto ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function dinheiro(valor) {
    if (typeof valor === 'number') {
      if (!Number.isFinite(valor) || valor < 0) {
        throw new Error('O relatório contém um valor monetário inválido.')
      }
      return Math.round(valor * 100) / 100
    }
    if (typeof valor !== 'string') {
      throw new Error('O relatório contém um valor monetário inválido.')
    }

    const texto = valor.replace(/\s/g, '').replace(/R\$/gi, '')
    let limpo = texto
    if (texto.includes(',')) {
      limpo = texto.replace(/\./g, '').replace(',', '.')
    } else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
      limpo = texto.replace(/\./g, '')
    }
    const numero = Number(limpo.replace(/[^\d.-]/g, ''))
    if (!Number.isFinite(numero) || numero < 0 || numero > 100000000) {
      throw new Error(`Valor monetário inválido: "${valor}".`)
    }
    return Math.round(numero * 100) / 100
  }

  function dataIso(dia, mes, ano) {
    const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)))
    if (
      data.getUTCFullYear() !== Number(ano) ||
      data.getUTCMonth() !== Number(mes) - 1 ||
      data.getUTCDate() !== Number(dia)
    ) {
      throw new Error('O período do relatório contém uma data inválida.')
    }
    return `${ano}-${mes}-${dia}`
  }

  function periodoDoTexto(texto) {
    const normalizado = normalizar(texto)
    const intervaloBr = normalizado.match(
      /(?:periodo:?\s*)?(\d{2})[-/](\d{2})[-/](\d{4})\s*(?:a|ate|-|–|—)\s*(\d{2})[-/](\d{2})[-/](\d{4})/,
    )
    const intervaloIso = normalizado.match(
      /(?:periodo:?\s*)?(\d{4})-(\d{2})-(\d{2})\s*(?:a|ate|–|—)\s*(\d{4})-(\d{2})-(\d{2})/,
    )
    const intervalo = intervaloBr ?? (intervaloIso
      ? [
          intervaloIso[0],
          intervaloIso[3],
          intervaloIso[2],
          intervaloIso[1],
          intervaloIso[6],
          intervaloIso[5],
          intervaloIso[4],
        ]
      : null)
    if (!intervalo) return null

    const periodoInicio = dataIso(intervalo[1], intervalo[2], intervalo[3])
    const periodoFim = dataIso(intervalo[4], intervalo[5], intervalo[6])
    if (
      intervalo[1] !== '01' ||
      periodoInicio.slice(0, 7) !== periodoFim.slice(0, 7) ||
      periodoInicio > periodoFim
    ) {
      throw new Error(
        'O relatório precisa começar no dia 01 e terminar no mesmo mês.',
      )
    }
    return { periodoInicio, periodoFim }
  }

  function conferirProfissionais(periodo, profissionais) {
    if (!periodo || profissionais.length === 0 || profissionais.length > 100) {
      throw new Error(
        'Não encontrei o período e a tabela-resumo completa do relatório.',
      )
    }

    const nomes = profissionais.map(item => normalizar(item.nomeRelatorio))
    if (nomes.some(nome => !nome) || new Set(nomes).size !== nomes.length) {
      throw new Error('Os nomes dos profissionais estão vazios ou repetidos.')
    }

    for (const profissional of profissionais) {
      const composicao = Math.round((
        profissional.servicosAcumulado +
        profissional.produtosAcumulado +
        profissional.assinaturasAcumulado
      ) * 100) / 100
      if (Math.abs(composicao - profissional.faturamentoAcumulado) > 0.05) {
        throw new Error(
          `Os números de ${profissional.nomeRelatorio} não fecham: serviços + produtos + assinaturas é diferente do faturamento bruto.`,
        )
      }
    }

    return {
      ...periodo,
      profissionais,
    }
  }

  function corresponde(rotulo, alternativas) {
    const texto = normalizar(rotulo)
    return alternativas.some(alternativa =>
      texto === alternativa || texto.startsWith(`${alternativa} `),
    )
  }

  function textosMonetarios(celulas) {
    return celulas.flatMap(celula =>
      String(celula).match(/R\$\s*[\d.]+,\d{2}/gi) ?? [],
    )
  }

  function linhasDaTabela(tabela) {
    return [...tabela.querySelectorAll('tr')]
      .map(linha => [...linha.querySelectorAll('th, td')]
        .map(celula =>
          celula.innerText?.trim() ?? celula.textContent?.trim() ?? '',
        ))
      .filter(celulas => celulas.length > 1)
  }

  function cabecalhoDaTabela(linhas) {
    const indiceClassico = linhas.findIndex(celulas =>
      celulas.some(celula => normalizar(celula) === 'profissional') &&
      celulas.some(celula => normalizar(celula) === 'total'),
    )
    if (indiceClassico >= 0) {
      const cabecalho = linhas[indiceClassico]
      const inicioNomes = cabecalho.findIndex(
        celula => normalizar(celula) === 'profissional',
      ) + 1
      const fimNomes = cabecalho.findIndex(
        celula => normalizar(celula) === 'total',
      )
      return {
        indice: indiceClassico,
        inicioNomes,
        fimNomes,
      }
    }

    const indiceDetalhado = linhas.findIndex(celulas =>
      corresponde(celulas[0], CABECALHOS_DETALHADOS),
    )
    if (indiceDetalhado < 0) return null
    return {
      indice: indiceDetalhado,
      inicioNomes: 1,
      fimNomes: linhas[indiceDetalhado].length,
    }
  }

  function nomesDoCabecalho(linhas, cabecalho) {
    return linhas[cabecalho.indice]
      .slice(cabecalho.inicioNomes, cabecalho.fimNomes)
      .map(nome => nome.replace(/\s+/g, ' ').trim())
      .filter(nome => nome && !/R\$/i.test(nome))
  }

  function trilhasDasLinhas(linhas, quantidade) {
    const trilhas = {}
    for (const [campo, alternativas] of Object.entries(LABELS)) {
      const candidatas = linhas.filter(celulas =>
        celulas.some(celula => corresponde(celula, alternativas)),
      )
      for (const linha of candidatas) {
        const valores = textosMonetarios(linha)
        if (valores.length < quantidade) continue
        try {
          trilhas[campo] = valores.slice(0, quantidade).map(dinheiro)
          break
        } catch {
          // A próxima linha com o mesmo rótulo ainda pode ser a detalhada.
        }
      }
    }
    return trilhas
  }

  function leituraDasTrilhas(periodo, nomes, trilhas) {
    if (
      nomes.length === 0 ||
      Object.keys(LABELS).some(campo =>
        !Array.isArray(trilhas[campo]) ||
        trilhas[campo].length !== nomes.length,
      )
    ) {
      return null
    }
    return conferirProfissionais(
      periodo,
      nomes.map((nomeRelatorio, indice) => ({
        nomeRelatorio,
        servicosAcumulado: trilhas.servicosAcumulado[indice],
        produtosAcumulado: trilhas.produtosAcumulado[indice],
        assinaturasAcumulado: trilhas.assinaturasAcumulado[indice],
        faturamentoAcumulado: trilhas.faturamentoAcumulado[indice],
        comissaoAcumulada: trilhas.comissaoAcumulada[indice],
      })),
    )
  }

  function tabelaDoDocumento(documento, periodo) {
    const tabelas = [...documento.querySelectorAll('table')]
      .map(linhasDaTabela)
      .filter(linhas => linhas.length > 0)
    const todasAsLinhas = tabelas.flat()

    for (const linhas of tabelas) {
      const cabecalho = cabecalhoDaTabela(linhas)
      if (!cabecalho) continue
      const nomes = nomesDoCabecalho(linhas, cabecalho)
      if (nomes.length === 0) continue

      // A comissão pode aparecer em outra grade, mas conserva a mesma ordem
      // dos profissionais. Por isso as trilhas são procuradas na página toda.
      const leitura = leituraDasTrilhas(
        periodo,
        nomes,
        trilhasDasLinhas(todasAsLinhas, nomes.length),
      )
      if (leitura) return leitura
    }
    return null
  }

  function linhasDoTexto(texto) {
    return String(texto)
      .split(/\n+/)
      .map(linha => linha.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  }

  function valoresDepoisDoRotulo(linhas, indice, quantidade) {
    const valores = []
    for (let atual = indice; atual < linhas.length; atual += 1) {
      if (
        atual > indice &&
        Object.values(LABELS).some(alternativas =>
          corresponde(linhas[atual], alternativas),
        )
      ) {
        break
      }
      valores.push(...textosMonetarios([linhas[atual]]))
      if (valores.length >= quantidade) {
        return valores.slice(0, quantidade).map(dinheiro)
      }
    }
    return null
  }

  function tabelaDoTexto(texto, periodo) {
    const linhas = linhasDoTexto(texto)
    const indiceCabecalho = linhas.findIndex(linha =>
      corresponde(linha, CABECALHOS_DETALHADOS),
    )
    if (indiceCabecalho < 0) return null

    const indicePrimeiraTrilha = linhas.findIndex((linha, indice) =>
      indice > indiceCabecalho &&
      corresponde(linha, LABELS.servicosAcumulado),
    )
    if (indicePrimeiraTrilha < 0) return null

    const nomes = linhas
      .slice(indiceCabecalho + 1, indicePrimeiraTrilha)
      .filter(linha =>
        !/R\$/i.test(linha) &&
        !Object.values(LABELS).some(alternativas =>
          corresponde(linha, alternativas),
        ),
      )
      .filter((nome, indice, todos) =>
        todos.findIndex(item => normalizar(item) === normalizar(nome)) === indice,
      )
    if (nomes.length === 0 || nomes.length > 100) return null

    const trilhas = {}
    for (const [campo, alternativas] of Object.entries(LABELS)) {
      const indices = linhas
        .map((linha, indice) => corresponde(linha, alternativas) ? indice : -1)
        .filter(indice => indice >= indicePrimeiraTrilha)
      for (const indice of indices) {
        const valores = valoresDepoisDoRotulo(linhas, indice, nomes.length)
        if (valores?.length === nomes.length) {
          trilhas[campo] = valores
          break
        }
      }
    }
    return leituraDasTrilhas(periodo, nomes, trilhas)
  }

  function chaveCorrespondente(objeto, alternativas) {
    return Object.keys(objeto).find(chave => {
      const normalizada = normalizar(
        chave.replace(/([a-zà-ÿ])([A-Z])/g, '$1 $2'),
      ).replace(/[_-]/g, ' ')
      return alternativas.some(alternativa =>
        normalizada === alternativa ||
        normalizada.includes(alternativa),
      )
    })
  }

  function valorPorChave(objeto, alternativas) {
    const chave = chaveCorrespondente(objeto, alternativas)
    return chave ? objeto[chave] : undefined
  }

  function nomeDoItem(item) {
    const valor = valorPorChave(item, [
      'nome profissional',
      'nome barbeiro',
      'profissional',
      'barbeiro',
      'nome',
    ])
    if (typeof valor === 'string') return valor
    if (valor && typeof valor === 'object') {
      const interno = valorPorChave(valor, ['nome', 'name'])
      if (typeof interno === 'string') return interno
    }
    return null
  }

  function profissionalDoJson(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const nomeRelatorio = nomeDoItem(item)
    if (!nomeRelatorio) return null

    const aliases = {
      servicosAcumulado: ['total servicos', 'servicos'],
      produtosAcumulado: ['total produtos', 'produtos'],
      assinaturasAcumulado: ['total assinaturas', 'assinaturas'],
      faturamentoAcumulado: [
        'rendimento total bruto',
        'faturamento bruto',
        'total bruto',
        'faturamento',
      ],
      comissaoAcumulada: [
        'total em comissoes',
        'total comissoes',
        'comissao total',
        'comissao',
      ],
    }
    const saida = { nomeRelatorio: String(nomeRelatorio).trim() }
    try {
      for (const [campo, alternativas] of Object.entries(aliases)) {
        const valor = valorPorChave(item, alternativas)
        if (valor === undefined) return null
        saida[campo] = dinheiro(valor)
      }
    } catch {
      return null
    }
    return saida
  }

  function procurarPeriodo(valor, profundidade = 0) {
    if (profundidade > 8 || valor === null || valor === undefined) return null
    if (typeof valor === 'string') return periodoDoTexto(valor)
    if (Array.isArray(valor)) {
      for (const item of valor) {
        const achado = procurarPeriodo(item, profundidade + 1)
        if (achado) return achado
      }
      return null
    }
    if (typeof valor !== 'object') return null

    const inicio = valorPorChave(valor, [
      'periodo inicio',
      'data inicio',
      'data inicial',
    ])
    const fim = valorPorChave(valor, [
      'periodo fim',
      'data fim',
      'data final',
    ])
    if (typeof inicio === 'string' && typeof fim === 'string') {
      const combinado = periodoDoTexto(`Período: ${inicio} a ${fim}`)
      if (combinado) return combinado
    }
    for (const item of Object.values(valor)) {
      const achado = procurarPeriodo(item, profundidade + 1)
      if (achado) return achado
    }
    return null
  }

  function procurarLista(valor, profundidade = 0) {
    if (profundidade > 8 || valor === null || valor === undefined) return null
    if (Array.isArray(valor)) {
      const profissionais = valor.map(profissionalDoJson)
      if (
        profissionais.length > 0 &&
        profissionais.every(Boolean)
      ) {
        return profissionais
      }
      for (const item of valor) {
        const achado = procurarLista(item, profundidade + 1)
        if (achado) return achado
      }
      return null
    }
    if (typeof valor !== 'object') return null
    for (const item of Object.values(valor)) {
      const achado = procurarLista(item, profundidade + 1)
      if (achado) return achado
    }
    return null
  }

  function parseJson(valor) {
    try {
      const periodo = procurarPeriodo(valor) ??
        periodoDoTexto(JSON.stringify(valor))
      const profissionais = procurarLista(valor)
      if (!periodo || !profissionais) {
        return {
          ok: false,
          error: 'A resposta JSON não contém o resumo completo esperado.',
        }
      }
      return {
        ok: true,
        leitura: conferirProfissionais(periodo, profissionais),
        origem: 'json',
      }
    } catch (erro) {
      return {
        ok: false,
        error: erro instanceof Error ? erro.message : String(erro),
      }
    }
  }

  function parseDocument(documento) {
    try {
      const texto = documento.body?.innerText ?? documento.documentElement?.innerText ?? ''
      const marca = normalizar(`${documento.title} ${texto.slice(0, 50000)}`)
      const pareceAgenda =
        marca.includes('agenda servico') ||
        marca.includes('relatorio de faturamento total')
      const loginNecessario = Boolean(
        documento.querySelector('input[type="password"]') ||
        (
          marca.includes('entrar') &&
          (marca.includes('senha') || marca.includes('login'))
        ),
      )
      if (loginNecessario) {
        return {
          ok: false,
          pareceAgenda,
          loginNecessario: true,
          error: 'Abra e faça login no Agenda Serviço primeiro.',
        }
      }
      const periodo = periodoDoTexto(texto)
      if (periodo) {
        const leituraTabela = tabelaDoDocumento(documento, periodo)
        if (leituraTabela) {
          return {
            ok: true,
            leitura: leituraTabela,
            origem: 'html',
            pareceAgenda,
          }
        }
        const leituraVisual = tabelaDoTexto(texto, periodo)
        if (leituraVisual) {
          return {
            ok: true,
            leitura: leituraVisual,
            origem: 'html',
            pareceAgenda,
          }
        }
      }

      for (const script of documento.querySelectorAll(
        'script[type="application/json"], script#__NEXT_DATA__',
      )) {
        try {
          const resultado = parseJson(JSON.parse(script.textContent ?? ''))
          if (resultado.ok) return { ...resultado, pareceAgenda }
        } catch {
          // Scripts não relacionados são ignorados. Só enviamos uma leitura
          // quando todas as cinco trilhas e o período passam na validação.
        }
      }

      return {
        ok: false,
        pareceAgenda,
        loginNecessario: false,
        error:
          'A tabela-resumo não está visível nesta aba.',
      }
    } catch (erro) {
      return {
        ok: false,
        pareceAgenda: false,
        loginNecessario: false,
        error: erro instanceof Error ? erro.message : String(erro),
      }
    }
  }

  globalThis.AgendaReportParser = {
    parseDocument,
    parseJson,
  }
})()
