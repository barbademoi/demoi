/* ============================================================================
 * EXTRATOR — roda DENTRO da página do Agenda Serviço (via chrome.scripting),
 * então reaproveita a sessão já logada (cookies) SEM pedir senha.
 *
 * PARTE 0 (confirmada pelo Network do agendas.link):
 *  - Os endpoints JSON do Agenda Serviço são a nível de CASA ou de cadastro:
 *      • get-dados-faturamento-bruto.ajax.php → totais da CASA
 *        { faturamento_total, faturamento_servicos, faturamento_assinaturas,
 *          faturamento_produtos }
 *      • getDadosFuncionarios.ajax.php → cadastro (id_funcionario, nome, % comissão)
 *      • getDadosServicosParaFuncionarios / details-faturamento-total → config/casa
 *    NENHUM devolve o valor em R$ POR BARBEIRO.
 *  - O detalhamento por barbeiro (tabela "Total detalhado" + cards) é montado
 *    na TELA. Então: totais da casa vêm do JSON; por barbeiro, lemos a tabela
 *    renderizada (mesma sessão logada). getPagamento fica como tentativa extra.
 *
 * Retorna:
 *  { ok:true, via, referencia:'YYYY-MM-DD',
 *    casa:{ faturamento, servicos, produtos, assinaturas },
 *    barbeiros:[{ nome, faturamento, comissao, servicos, produtos,
 *                 assinaturas, atendimentos }] }
 *  ou { ok:false, motivo } quando não achou o relatório / não está logado.
 * ==========================================================================*/
async function extrairAgendaServico() {
  // ── Endpoints JSON confirmados (relativos → usam a origem/sessão da página) ──
  const EP_CASA = [
    '/painel-adm/public/pages/relatorio/ajax/get-dados-faturamento-bruto.ajax.php',
    '/painel-adm/public/pages/ajax/relatorio/get-dados-faturamento-bruto.ajax.php',
  ]
  // Tentativa (best-effort) de comissão por barbeiro via JSON. Se responder
  // com lista por id_funcionario/nome + valor em R$, usamos; senão, DOM.
  const EP_PAGTO = [
    '/painel-adm/public/pages/template/ajax/getPagamento.ajax.php',
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
  const hojeBR = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const texto = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

  // Classifica um rótulo (de linha ou coluna) numa das nossas métricas.
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

  // ── 1. Totais da CASA (JSON confiável) ──
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
    } catch { /* segue */ }
  }

  // ── 2. Comissão por barbeiro (best-effort JSON) ──
  const comissaoPorNome = new Map() // nome normalizado -> R$
  for (const url of EP_PAGTO) {
    try {
      const r = await fetch(url, { credentials: 'include', headers: { accept: 'application/json' } })
      if (!r.ok) continue
      const d = await r.json()
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
      for (const it of arr) {
        const val = brNum(it.valor ?? it.comissao_valor ?? it.valor_comissao ?? it.total)
        if (val > 0 && it.nome) comissaoPorNome.set(semAcento(it.nome), val)
      }
    } catch { /* segue */ }
  }

  // ── 3. Por barbeiro: tabela "Total detalhado" renderizada ──
  const barbeiros = lerBarbeirosDaTela()
  for (const b of barbeiros) {
    const c = comissaoPorNome.get(semAcento(b.nome))
    if ((!b.comissao || b.comissao === 0) && c) b.comissao = c
  }

  if (barbeiros.length === 0 && !casa) return { ok: false, motivo: 'nao_encontrado' }

  return { ok: true, via: 'json+html', referencia, casa: casa || null, barbeiros }

  // ── helpers de DOM ────────────────────────────────────────────────────────
  // Layout observado: barbeiros nas COLUNAS, métricas nas LINHAS (transposta).
  // Também tratamos o layout tradicional (barbeiros nas linhas) como fallback.
  function lerBarbeirosDaTela() {
    for (const tabela of Array.from(document.querySelectorAll('table'))) {
      const linhas = Array.from(tabela.querySelectorAll('tr')).filter(tr => tr.querySelector('td, th'))
      if (linhas.length < 2) continue
      const head = Array.from(linhas[0].querySelectorAll('th, td')).map(texto)

      // TRANSPOSTA: rótulos de métrica na 1ª coluna das linhas seguintes.
      const rotulos = linhas.slice(1).map(tr => classificar(texto(tr.querySelector('th, td'))))
      if (rotulos.filter(Boolean).length >= 2) {
        const nomes = head.slice(1).map(n => n.trim())
        const alvo = nomes
          .map((nome, col) => ({ nome, col }))
          .filter(x => x.nome && !classificar(x.nome) && !/total|geral|casa|soma/i.test(x.nome))
        if (alvo.length) {
          const acc = new Map(alvo.map(a => [a.col, base(a.nome)]))
          linhas.slice(1).forEach((tr, i) => {
            const chave = rotulos[i]
            if (!chave) return
            const cels = Array.from(tr.querySelectorAll('td')).map(texto)
            const offset = cels.length - nomes.length // rótulo pode ocupar a 1ª td
            alvo.forEach(a => {
              const raw = cels[a.col + Math.max(0, offset)]
              if (raw != null) acc.get(a.col)[chave] = brNum(raw)
            })
          })
          const lista = Array.from(acc.values()).map(finalizar).filter(temAlgumValor)
          if (lista.length) return lista
        }
      }

      // TRADICIONAL: barbeiros nas linhas, métricas nas colunas.
      const idx = {}
      head.forEach((h, i) => { const k = classificar(h); if (k && idx[k] == null) idx[k] = i })
      const iNome = head.findIndex(h => /barbeiro|profissional|colaborador|funcionario|nome/.test(semAcento(h)))
      if (iNome >= 0 && (idx.faturamento != null || idx.comissao != null || idx.servicos != null)) {
        const lista = []
        for (const tr of linhas.slice(1)) {
          const cels = Array.from(tr.querySelectorAll('td')).map(texto)
          const nome = (cels[iNome] || '').trim()
          if (!nome || /total|geral|soma|casa/i.test(nome)) continue
          const b = base(nome)
          for (const k of ['faturamento', 'comissao', 'servicos', 'produtos', 'assinaturas', 'atendimentos']) {
            if (idx[k] != null) b[k] = brNum(cels[idx[k]])
          }
          lista.push(finalizar(b))
        }
        const filt = lista.filter(temAlgumValor)
        if (filt.length) return filt
      }
    }
    return []
  }

  function base(nome) {
    return { nome, faturamento: 0, comissao: 0, servicos: 0, produtos: 0, assinaturas: 0, atendimentos: 0 }
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
