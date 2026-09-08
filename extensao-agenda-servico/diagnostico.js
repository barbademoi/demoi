/* ============================================================================
 * DIAGNÓSTICO — descreve COMO a tela do relatório está montada.
 *
 * O extrator só sabe ler <table>. Quando a tela usa outra coisa (divs em grid,
 * por exemplo), ele volta de mãos vazias e a extensão diz "não achei o
 * relatório" — verdade, mas inútil: não dá pra saber o que fazer.
 *
 * Este relatório existe pra não ficar chutando. Ele descreve a ESTRUTURA da
 * página o suficiente pra escrever o leitor certo de primeira, e é montado com
 * cuidado pra não virar um despejo do HTML inteiro:
 *   - trechos de texto vêm cortados;
 *   - nomes e valores APARECEM, porque são justamente o que precisa ser lido —
 *     quem manda o diagnóstico está mandando o próprio relatório, e isso é dito
 *     na tela antes de copiar.
 * ==========================================================================*/
async function diagnosticarAgendaServico() {
  const corta = (s, n) => {
    const t = String(s || '').replace(/\s+/g, ' ').trim()
    return t.length > n ? t.slice(0, n) + '…' : t
  }
  const L = []
  const p = (s) => L.push(s)

  p('=== DIAGNÓSTICO DA TELA DO RELATÓRIO ===')
  p('url: ' + corta(location.href, 160))
  p('')

  // ── 1. Tabelas de verdade ──
  const tabelas = Array.from(document.querySelectorAll('table'))
  p(`<table> na página: ${tabelas.length}`)
  tabelas.slice(0, 6).forEach((t, i) => {
    const trs = Array.from(t.querySelectorAll('tr'))
    p(`  [${i}] ${trs.length} linha(s)`)
    trs.slice(0, 3).forEach((tr, j) => {
      const cels = Array.from(tr.querySelectorAll('th, td')).map((c) => corta(c.textContent, 22))
      p(`      linha${j}: ${JSON.stringify(cels.slice(0, 12))}`)
    })
  })
  p('')

  // ── 2. Onde está o "Total detalhado" e do que ele é feito ──
  // É o bloco que tem os números por barbeiro. Saber a TAG e as classes do
  // container é o que permite escrever o seletor certo.
  const candidatos = Array.from(document.querySelectorAll('*')).filter((el) => {
    if (el.children.length > 3) return false
    const t = (el.textContent || '').trim().toLowerCase()
    return t.length < 40 && /total detalhado|faturamento bruto|saldos/.test(t)
  })
  // Um rótulo casa em vários níveis (o <h5>, o pai dele, o avô…). Sem
  // deduplicar, três cópias de "Saldos" comem as vagas e o "Total detalhado" —
  // que é o bloco que importa — fica de fora do relatório.
  const maisFundo = new Map()
  for (const el of candidatos) {
    const chave = (el.textContent || '').trim().toLowerCase()
    const atual = maisFundo.get(chave)
    if (!atual || atual.contains(el)) maisFundo.set(chave, el)
  }
  const alvos = Array.from(maisFundo.values())
  p(`rótulos-âncora encontrados: ${alvos.length} (de ${candidatos.length} ocorrências)`)
  alvos.slice(0, 6).forEach((el, i) => {
    p(`  [${i}] "${corta(el.textContent, 30)}" em <${el.tagName.toLowerCase()} class="${corta(el.className, 60)}">`)
    // Sobe alguns níveis: o container do bloco costuma estar 2-4 acima.
    let pai = el.parentElement
    for (let n = 0; n < 4 && pai; n++, pai = pai.parentElement) {
      const filhos = Array.from(pai.children).map((c) => c.tagName.toLowerCase())
      const disp = getComputedStyle(pai).display
      p(`      pai${n}: <${pai.tagName.toLowerCase()} class="${corta(pai.className, 70)}"> display:${disp} filhos:${JSON.stringify(filhos.slice(0, 10))}`)
    }
  })
  p('')

  // ── 3. Como os nomes e os valores aparecem juntos ──
  // Pega elementos-folha com "R$" e mostra o texto do avô: é ali que costuma
  // estar o par nome+valor que o leitor precisa casar.
  const comReais = Array.from(document.querySelectorAll('*')).filter(
    (el) => el.children.length === 0 && /R\$\s*[\d.,]+/.test(el.textContent || ''),
  )
  p(`elementos-folha com "R$": ${comReais.length}`)
  comReais.slice(0, 12).forEach((el, i) => {
    const avo = el.parentElement?.parentElement
    p(`  [${i}] <${el.tagName.toLowerCase()} class="${corta(el.className, 40)}"> = "${corta(el.textContent, 20)}"`)
    p(`      avô: <${avo?.tagName.toLowerCase()} class="${corta(avo?.className, 50)}"> texto: "${corta(avo?.textContent, 90)}"`)
  })
  p('')

  // ── 4. Os endpoints JSON respondem? ──
  const EPS = [
    '/painel-adm/public/pages/relatorio/ajax/get-dados-faturamento-bruto.ajax.php',
    '/painel-adm/public/pages/ajax/relatorio/get-dados-faturamento-bruto.ajax.php',
    '/painel-adm/public/pages/template/ajax/getPagamento.ajax.php',
  ]
  for (const ep of EPS) {
    try {
      const r = await fetch(ep, { credentials: 'include', headers: { accept: 'application/json' } })
      const txt = await r.text()
      p(`${r.status} ${ep}`)
      p(`      resposta: ${corta(txt, 200)}`)
    } catch (e) {
      p(`ERRO ${ep} → ${corta(e?.message || e, 60)}`)
    }
  }

  p('')
  p('=== FIM ===')
  return L.join('\n')
}
