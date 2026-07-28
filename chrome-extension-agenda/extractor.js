(async () => {
  'use strict'

  const resultado = globalThis.AgendaReportParser.parseDocument(document)
  const palavrasRelatorio = /(agenda|relat[oó]rio|faturamento|comiss|finance|revenue|report)/i
  const recursos = performance
    .getEntriesByType('resource')
    .filter(item =>
      ['fetch', 'xmlhttprequest', 'other'].includes(item.initiatorType) &&
      palavrasRelatorio.test(item.name),
    )
    .map(item => item.name)
    .filter((url, indice, todos) =>
      /^https?:\/\//i.test(url) && todos.indexOf(url) === indice,
    )
    .slice(-12)

  if (!resultado.ok && !resultado.loginNecessario) {
    const candidatos = [location.href, ...recursos]
      .filter((url, indice, todos) =>
        /^https?:\/\//i.test(url) && todos.indexOf(url) === indice,
      )
    for (const url of candidatos.slice(0, 13)) {
      try {
        const resposta = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          redirect: 'follow',
        })
        if (!resposta.ok) continue
        const tipo = resposta.headers.get('content-type')?.toLowerCase() ?? ''

        if (tipo.includes('application/json')) {
          const json = globalThis.AgendaReportParser.parseJson(
            await resposta.json(),
          )
          if (json.ok) {
            return {
              ...json,
              origem: 'json_endpoint',
              pagina: { titulo: document.title, url: location.href },
              recursos,
            }
          }
          continue
        }

        if (tipo.includes('application/pdf')) {
          const pdf = await resposta.blob()
          const leitor = new FileReader()
          const base64 = await new Promise((resolve, reject) => {
            leitor.onerror = () => reject(leitor.error)
            leitor.onload = () => resolve(
              String(leitor.result).split(',')[1] ?? '',
            )
            leitor.readAsDataURL(pdf)
          })
          if (base64) {
            return {
              ok: true,
              origem: 'pdf',
              pdfBase64: base64,
              pdfNome:
                decodeURIComponent(new URL(resposta.url).pathname.split('/').pop()) ||
                'relatorio-agenda.pdf',
              pagina: { titulo: document.title, url: location.href },
              recursos,
            }
          }
          continue
        }

        if (tipo.includes('text/html')) {
          const documento = new DOMParser().parseFromString(
            await resposta.text(),
            'text/html',
          )
          const html = globalThis.AgendaReportParser.parseDocument(documento)
          if (html.ok) {
            return {
              ...html,
              origem: 'html',
              pagina: { titulo: document.title, url: location.href },
              recursos,
            }
          }
        }
      } catch {
        // Só aceitamos uma resposta quando o formato completo é reconhecido.
      }
    }
  }

  return {
    ...resultado,
    pagina: {
      titulo: document.title,
      url: location.href,
    },
    recursos,
  }
})()
