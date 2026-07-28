(() => {
  'use strict'

  const ENDPOINT_PADRAO =
    'https://barbermeta.com.br/api/importacao-agenda/extensao'
  const botaoAtualizar = document.querySelector('#atualizar')
  const botaoSalvar = document.querySelector('#salvar')
  const campoToken = document.querySelector('#token')
  const campoEndpoint = document.querySelector('#endpoint')
  const status = document.querySelector('#status')
  const configuracoes = document.querySelector('#configuracoes')

  function mostrarStatus(mensagem, tipo = '') {
    status.hidden = false
    status.className = `status ${tipo}`.trim()
    status.textContent = mensagem
  }

  function limparStatus() {
    status.hidden = true
    status.className = 'status'
    status.textContent = ''
  }

  function erroLegivel(erro) {
    if (erro instanceof Error) return erro.message
    return String(erro)
  }

  async function carregarConfiguracao() {
    const salvo = await chrome.storage.local.get([
      'barberMetaToken',
      'barberMetaEndpoint',
    ])
    campoToken.value = salvo.barberMetaToken ?? ''
    campoEndpoint.value = salvo.barberMetaEndpoint ?? ENDPOINT_PADRAO
    if (!salvo.barberMetaToken) configuracoes.open = true
  }

  async function salvarConfiguracao() {
    const token = campoToken.value.trim()
    const endpoint = campoEndpoint.value.trim() || ENDPOINT_PADRAO
    if (token.length < 32) {
      throw new Error('O token privado precisa ter pelo menos 32 caracteres.')
    }
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') {
      throw new Error('O endereço do BarberMeta precisa usar HTTPS.')
    }
    await chrome.storage.local.set({
      barberMetaToken: token,
      barberMetaEndpoint: url.href,
    })
    campoEndpoint.value = url.href
    mostrarStatus('Configuração salva neste Chrome.', 'success')
  }

  function padraoOrigem(url) {
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return `${url.origin}/*`
  }

  async function permitirAgenda(url) {
    const origem = padraoOrigem(url)
    if (!origem) return false
    const jaPermitido = await chrome.permissions.contains({ origins: [origem] })
    if (jaPermitido) return true
    return chrome.permissions.request({ origins: [origem] })
  }

  async function extrairDaAba(tabId) {
    const execucao = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['report-parser.js', 'extractor.js'],
    })
    return execucao[0]?.result ?? null
  }

  async function buscarRecurso(url) {
    const resposta = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'follow',
    })
    if (!resposta.ok) {
      throw new Error(`O Agenda respondeu ${resposta.status}.`)
    }

    const tipo = resposta.headers.get('content-type')?.toLowerCase() ?? ''
    if (tipo.includes('application/pdf') || url.toLowerCase().includes('.pdf')) {
      return {
        tipo: 'pdf',
        origem: 'pdf',
        corpo: await resposta.blob(),
        nome: decodeURIComponent(new URL(resposta.url).pathname.split('/').pop()) ||
          'relatorio-agenda.pdf',
      }
    }
    if (tipo.includes('application/json')) {
      const resultado = globalThis.AgendaReportParser.parseJson(
        await resposta.json(),
      )
      if (!resultado.ok) throw new Error(resultado.error)
      return {
        tipo: 'json',
        origem: 'json_endpoint',
        leitura: resultado.leitura,
      }
    }

    const html = await resposta.text()
    const documento = new DOMParser().parseFromString(html, 'text/html')
    const resultado = globalThis.AgendaReportParser.parseDocument(documento)
    if (resultado.loginNecessario) {
      throw new Error('Abra e faça login no Agenda Serviço primeiro.')
    }
    if (!resultado.ok) throw new Error(resultado.error)
    return { tipo: 'json', origem: resultado.origem ?? 'html', leitura: resultado.leitura }
  }

  async function encontrarLeitura(tab, extracao, permissaoAgenda) {
    if (extracao?.pdfBase64) {
      const bytes = Uint8Array.from(
        atob(extracao.pdfBase64),
        caractere => caractere.charCodeAt(0),
      )
      return {
        tipo: 'pdf',
        origem: 'pdf',
        corpo: new Blob([bytes], { type: 'application/pdf' }),
        nome: extracao.pdfNome ?? 'relatorio-agenda.pdf',
      }
    }
    if (extracao?.ok) {
      return {
        tipo: 'json',
        origem: extracao.origem ?? 'html',
        leitura: extracao.leitura,
      }
    }
    if (extracao?.loginNecessario) {
      throw new Error('Abra e faça login no Agenda Serviço primeiro.')
    }

    if (permissaoAgenda && /^https?:\/\//i.test(tab.url ?? '')) {
      const candidatos = [
        ...(extracao?.recursos ?? []).reverse(),
        tab.url,
      ].filter((url, indice, todos) => todos.indexOf(url) === indice)

      for (const url of candidatos.slice(0, 13)) {
        try {
          return await buscarRecurso(url)
        } catch {
          // Uma página costuma carregar diversos recursos não relacionados.
          // Só seguimos quando um deles passa pela validação completa.
        }
      }
    }

    if (extracao && !extracao.pareceAgenda) {
      throw new Error(
        'Abra o Agenda Serviço e deixe o relatório de faturamento total aberto.',
      )
    }
    throw new Error(
      'Não encontrei os números do relatório. Abra o “Relatório de faturamento total” com o período do dia e tente novamente.',
    )
  }

  async function enviarAoBarberMeta(relatorio, token, endpoint) {
    const cabecalhos = {
      Authorization: `Bearer ${token}`,
    }
    let corpo
    if (relatorio.tipo === 'pdf') {
      corpo = relatorio.corpo
      cabecalhos['Content-Type'] = 'application/pdf'
      cabecalhos['X-Agenda-File-Name'] = relatorio.nome
    } else {
      corpo = JSON.stringify(relatorio.leitura)
      cabecalhos['Content-Type'] = 'application/json'
      cabecalhos['X-Agenda-File-Name'] =
        `extensao-agenda-${relatorio.leitura.periodoFim}.json`
    }

    const resposta = await fetch(endpoint, {
      method: 'POST',
      headers: cabecalhos,
      body: corpo,
      cache: 'no-store',
    })
    let payload
    try {
      payload = await resposta.json()
    } catch {
      throw new Error('O BarberMeta retornou uma resposta inesperada.')
    }
    if (!resposta.ok || !payload.ok) {
      throw new Error(payload.error || 'O BarberMeta recusou a atualização.')
    }
    return payload
  }

  async function atualizar() {
    limparStatus()
    botaoAtualizar.disabled = true
    botaoAtualizar.textContent = 'Lendo relatório…'
    try {
      const configuracao = await chrome.storage.local.get([
        'barberMetaToken',
        'barberMetaEndpoint',
      ])
      const token = configuracao.barberMetaToken?.trim()
      const endpoint = configuracao.barberMetaEndpoint ?? ENDPOINT_PADRAO
      if (!token) {
        configuracoes.open = true
        throw new Error(
          'Configure primeiro o token privado do BarberMeta logo abaixo.',
        )
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id || !tab.url) {
        throw new Error('Não foi possível identificar a aba aberta.')
      }
      const url = new URL(tab.url)
      const permissaoAgenda = await permitirAgenda(url)

      let extracao = null
      try {
        extracao = await extrairDaAba(tab.id)
      } catch {
        // O visualizador nativo de PDF não aceita scripts. Nesse caso a
        // extensão busca o próprio PDF pela URL, usando os cookies existentes.
      }

      const relatorio = await encontrarLeitura(
        tab,
        extracao,
        permissaoAgenda,
      )
      const quantidade = relatorio.tipo === 'json'
        ? relatorio.leitura.profissionais.length
        : null
      botaoAtualizar.textContent = quantidade
        ? `Enviando ${quantidade} profissionais…`
        : 'Enviando relatório…'

      const resultado = await enviarAoBarberMeta(relatorio, token, endpoint)
      const reimportacao = resultado.resultado?.reimportacao
        ? '\nA foto deste dia foi atualizada, sem duplicar.'
        : ''
      const fonte = {
        json_endpoint: 'endpoint interno (JSON)',
        json: 'dados estruturados da página',
        html: 'tabela visível',
        pdf: 'PDF do relatório',
      }[relatorio.origem] ?? 'relatório validado'
      mostrarStatus(
        `Enviado — ${resultado.barbeirosAtualizados} barbeiros atualizados.\nFonte: ${fonte}.${reimportacao}`,
        'success',
      )
    } catch (erro) {
      mostrarStatus(erroLegivel(erro), 'error')
    } finally {
      botaoAtualizar.disabled = false
      botaoAtualizar.textContent = 'Atualizar infos no BarberMeta'
    }
  }

  botaoSalvar.addEventListener('click', async () => {
    try {
      await salvarConfiguracao()
    } catch (erro) {
      mostrarStatus(erroLegivel(erro), 'error')
    }
  })
  botaoAtualizar.addEventListener('click', atualizar)
  void carregarConfiguracao()
})()
