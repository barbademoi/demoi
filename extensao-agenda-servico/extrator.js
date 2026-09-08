/* ============================================================================
 * EXTRATOR — roda DENTRO da página do Agenda Serviço (via chrome.scripting),
 * então reaproveita a sessão já logada (cookies) SEM pedir senha.
 *
 * ESTRUTURA REAL DA TELA (confirmada por diagnóstico no agendas.link):
 *
 *  1. CARDS DO TOPO ("Saldos") — um por barbeiro, mais um da "Casa" e um
 *     "Total". Cada card é um bloco com o nome e um R$ logo abaixo.
 *     O que esse R$ é: a soma dos cards dos barbeiros MAIS o card da Casa dá
 *     exatamente o "Faturamento bruto: Total" da tela (conferido: 6.145,21 +
 *     6.113,95 = 12.259,16 contra 12.259,15, um centavo de arredondamento).
 *     Ou seja, é a REPARTIÇÃO do bruto — a parte de cada barbeiro é a comissão
 *     dele, e o resto fica com a casa.
 *
 *  2. TABELA "Total detalhado" — uma <table> de verdade, com os barbeiros nas
 *     COLUNAS. E aqui estava o bug: as linhas de valor NÃO têm célula de
 *     rótulo. A primeira célula da linha já é o primeiro valor. Os rótulos
 *     ("Serviços", "Produtos", …) moram FORA da tabela, num container irmão
 *     (.titleInfoTableTotal), alinhados por posição.
 *     O extrator antigo procurava o rótulo dentro da linha, classificava
 *     "R$1.678,00" como métrica nenhuma, desistia do formato transposto, e
 *     depois procurava uma coluna chamada "barbeiro" no cabeçalho — que é uma
 *     fila de nomes de pessoas. Não achava nada e reportava "não achei o
 *     relatório", com a tela do relatório aberta na frente.
 *
 *  3. ENDPOINTS JSON — o de totais da casa responde 500 hoje, e o getPagamento
 *     devolve lista vazia. Ficam como tentativa: se um dia voltarem, entram na
 *     frente. A tela é a fonte que funciona.
 *
 * Retorna:
 *  { ok:true, via, referencia:'YYYY-MM-DD',
 *    casa:{ faturamento, servicos, produtos, assinaturas },
 *    barbeiros:[{ nome, faturamento, comissao, servicos, produtos,
 *                 assinaturas, atendimentos }] }
 *  ou { ok:false, motivo } quando não achou o relatório / não está logado.
 * ==========================================================================*/
async function extrairAgendaServico() {
  const EP_CASA = [
    '/painel-adm/public/pages/relatorio/ajax/get-dados-faturamento-bruto.ajax.php',
    '/painel-adm/public/pages/ajax/relatorio/get-dados-faturamento-bruto.ajax.php',
  ]

  const brNum = (s) => {
    if (s == null) return 0
    if (typeof s === 'number') return Number.isFinite(s) ? s : 0
    const m = String(s).replace(/[^\d.,-]/g, '')
    if (!m) return 0
    const norm = m.replace(/\./g, '').replace(',', '.')
    const n = Number(norm)
    return Number.isFinite(n) ? n : 0
  }
  const temReais = (s) => /R\$\s*[\d.,]+/.test(String(s || ''))
  const hojeBR = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const semAcento = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const texto = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

  // "Casa", "Total" e afins são somatórios, não pessoas. Entram como totais da
  // casa, nunca como barbeiro — senão a barbearia vira um profissional no
  // ranking, com o faturamento inteiro no nome dela.
  const ehTotalizador = (nome) => /^(casa|total|geral|soma|todos)$/i.test(semAcento(nome))

  const classificar = (label) => {
    const t = semAcento(label)
    if (!t) return null
    if (/comiss/.test(t)) return 'comissao'
    if (/servic/.test(t)) return 'servicos'
    if (/produto/.test(t)) return 'produtos'
    if (/assinatura|clube|plano/.test(t)) return 'assinaturas'
    if (/atendimento|comanda|qtd/.test(t)) return 'atendimentos'
    if (/faturamento|total/.test(t)) return 'faturamento'
    return null
  }

  const referencia = hojeBR()
  const base = (nome) => ({ nome, faturamento: 0, comissao: 0, servicos: 0, produtos: 0, assinaturas: 0, atendimentos: 0 })

  // ── 1. Totais da CASA: JSON se responder, senão a própria tela ────────────
  let casa = null
  for (const url of EP_CASA) {
    try {
      const r = await fetch(url, { credentials: 'include', headers: { accept: 'application/json' } })
      if (!r.ok) continue
      const d = await r.json()
      if (d && (d.faturamento_total != null || d.faturamento_servicos != null)) {
        casa = {
          faturamento: brNum(d.faturamento_total),
          servicos: brNum(d.faturamento_servicos),
          produtos: brNum(d.faturamento_produtos),
          assinaturas: brNum(d.faturamento_assinaturas),
        }
        break
      }
    } catch { /* segue pra tela */ }
  }
  if (!casa) casa = lerCasaDaTela()

  // ── 2. Comissão por barbeiro: cards do topo ──────────────────────────────
  const comissaoPorNome = lerCardsDoTopo()

  // ── 3. Serviços/produtos/assinaturas por barbeiro: tabela detalhada ──────
  const porNome = new Map()
  for (const [nome, valor] of comissaoPorNome) {
    porNome.set(semAcento(nome), Object.assign(base(nome), { comissao: valor }))
  }
  for (const linha of lerTabelaDetalhada()) {
    const chave = semAcento(linha.nome)
    const alvo = porNome.get(chave) || base(linha.nome)
    for (const k of ['servicos', 'produtos', 'assinaturas', 'atendimentos', 'faturamento', 'comissao']) {
      // A tabela não sobrescreve a comissão vinda do card: o card é o número
      // que fecha com o bruto da tela.
      if (linha[k] != null && (k !== 'comissao' || !alvo.comissao)) alvo[k] = linha[k]
    }
    porNome.set(chave, alvo)
  }

  const barbeiros = Array.from(porNome.values())
    .filter((b) => !ehTotalizador(b.nome))
    .map(finalizar)
    .filter(temAlgumValor)

  if (barbeiros.length === 0 && !casa) return { ok: false, motivo: 'nao_encontrado' }

  return { ok: true, via: 'tela', referencia, casa: casa || null, barbeiros }

  // ── helpers ──────────────────────────────────────────────────────────────

  /**
   * Cards do topo: blocos com o nome numa linha e o R$ na outra.
   *
   * Ancorar no elemento-folha que tem o R$ e subir UM nível é o que torna isso
   * robusto: as classes do Agenda Serviço são utilitárias do Bootstrap
   * (d-flex, flex-column, ml-2…) e mudam com o layout. A forma "um nome e um
   * valor juntos" é o que não muda.
   */
  function lerCardsDoTopo() {
    const achados = new Map()
    for (const el of Array.from(document.querySelectorAll('span, div, p, h1, h2, h3, h4, h5'))) {
      if (el.children.length !== 0) continue
      const t = texto(el)
      if (!temReais(t)) continue

      const pai = el.parentElement
      if (!pai) continue
      // Os irmãos-folha sem R$ são candidatos a nome. Pega o primeiro que
      // pareça nome de gente (curto, com letra).
      const irmaos = Array.from(pai.children).filter((c) => c !== el && c.children.length === 0)
      const nome = irmaos.map(texto).find((s) => s && !temReais(s) && s.length <= 30 && /[a-zA-ZÀ-ÿ]/.test(s))
      if (!nome) continue
      // O bloco "Faturamento bruto" tem a MESMA forma dos cards — um rótulo e
      // um R$ juntos. Sem esta linha, "Serviços", "Produtos" e "Assinaturas"
      // entram no ranking como se fossem gente, cada um com o faturamento da
      // casa inteira no nome.
      if (classificar(nome)) continue
      if (ehTotalizador(nome)) continue
      // Um card por nome: o primeiro vence (os cards do topo vêm antes dos
      // blocos de rodapé, que repetem os mesmos nomes com outros números).
      if (!achados.has(nome)) achados.set(nome, brNum(t))
    }
    return achados
  }

  /**
   * "Faturamento bruto": blocos Total / Serviços / Produtos / Assinaturas.
   * Mesma âncora dos cards — rótulo e valor no mesmo bloco.
   */
  function lerCasaDaTela() {
    const out = { faturamento: 0, servicos: 0, produtos: 0, assinaturas: 0 }
    let achou = false
    for (const el of Array.from(document.querySelectorAll('span, div, p, h1, h2, h3, h4, h5'))) {
      if (el.children.length !== 0) continue
      const t = texto(el)
      if (!temReais(t)) continue
      const pai = el.parentElement
      if (!pai) continue
      const irmaos = Array.from(pai.children).filter((c) => c !== el && c.children.length === 0)
      const rotulo = irmaos.map(texto).find((s) => s && !temReais(s))
      const chave = classificar(rotulo)
      if (!chave || chave === 'atendimentos' || chave === 'comissao') continue
      const valor = brNum(t)
      if (chave === 'faturamento') {
        // "Total" só conta se ainda não temos um — o primeiro da tela é o do
        // bloco "Faturamento bruto".
        if (!out.faturamento) { out.faturamento = valor; achou = true }
      } else if (!out[chave]) {
        out[chave] = valor
        achou = true
      }
    }
    return achou ? out : null
  }

  /**
   * Tabela "Total detalhado".
   *
   * Barbeiros nas COLUNAS (primeira linha = só nomes, sem célula de rótulo).
   * Os rótulos das métricas ficam FORA da tabela, num container irmão com um
   * filho por linha — casados por POSIÇÃO. Quando esse container não é
   * encontrado, ainda dá pra usar a primeira célula da linha como rótulo, que
   * é o formato mais comum em outras telas.
   */
  function lerTabelaDetalhada() {
    for (const tabela of Array.from(document.querySelectorAll('table'))) {
      const linhas = Array.from(tabela.querySelectorAll('tr')).filter((tr) => tr.querySelector('td, th'))
      if (linhas.length < 2) continue

      const head = Array.from(linhas[0].querySelectorAll('th, td')).map(texto)
      const nomes = head.map((n, col) => ({ nome: n.trim(), col })).filter((x) => x.nome && !classificar(x.nome))
      if (nomes.length === 0) continue

      const rotulosFora = lerRotulosVizinhos(tabela, linhas.length)

      const acc = new Map(nomes.map((x) => [x.col, base(x.nome)]))
      let usou = false

      linhas.slice(1).forEach((tr, i) => {
        const cels = Array.from(tr.querySelectorAll('th, td')).map(texto)
        // Rótulo: primeiro o vizinho (alinhado por posição, +1 porque a
        // posição 0 corresponde à linha do cabeçalho), depois a 1ª célula.
        const chave = classificar(rotulosFora[i + 1]) || classificar(cels[0])
        if (!chave) return
        // Offset: se a linha tem uma célula a mais que o cabeçalho, a primeira
        // é o rótulo e os valores estão deslocados.
        const offset = Math.max(0, cels.length - head.length)
        for (const { col } of nomes) {
          const bruto = cels[col + offset]
          if (bruto == null) continue
          acc.get(col)[chave] = brNum(bruto)
          usou = true
        }
      })

      if (usou) return Array.from(acc.values())
    }
    return []
  }

  /**
   * Os rótulos que moram ao lado da tabela, um por linha.
   *
   * Procura, subindo a partir da tabela, um elemento vizinho com exatamente a
   * mesma quantidade de filhos que a tabela tem de linhas — é essa igualdade
   * que autoriza casar por posição. Sem ela, seria chute.
   */
  function lerRotulosVizinhos(tabela, qtdLinhas) {
    let no = tabela
    for (let nivel = 0; nivel < 4 && no; nivel++, no = no.parentElement) {
      const pai = no.parentElement
      if (!pai) break
      for (const irmao of Array.from(pai.children)) {
        if (irmao === no || irmao.contains(tabela)) continue
        const filhos = Array.from(irmao.children)
        if (filhos.length !== qtdLinhas) continue
        const rotulos = filhos.map(texto)
        // Pelo menos dois têm que ser métricas reconhecíveis; senão é outra
        // coisa com o mesmo número de filhos por coincidência.
        if (rotulos.filter((r) => classificar(r)).length >= 2) return rotulos
      }
    }
    return []
  }

  // Sem faturamento explícito? soma os componentes.
  function finalizar(b) {
    if (!b.faturamento || b.faturamento === 0) {
      const soma = (b.servicos || 0) + (b.produtos || 0) + (b.assinaturas || 0)
      if (soma > 0) b.faturamento = soma
    }
    return b
  }
  function temAlgumValor(b) {
    return (b.faturamento || b.comissao || b.servicos || b.produtos || b.assinaturas || b.atendimentos) > 0
  }
}
