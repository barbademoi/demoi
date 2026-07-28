/* ============================================================================
 * EXTRATOR — roda DENTRO da página do Agenda Serviço (via chrome.scripting),
 * então reaproveita a sessão já logada (cookies) SEM pedir senha.
 *
 * ⚠️ AJUSTE AQUI conforme o SEU Agenda Serviço (PARTE 0 — ver README):
 *  - CASO A (tem endpoint JSON interno): preencha ENDPOINTS_JSON com a(s) URL(s)
 *    que a página chama pra montar o relatório. A extensão chama a MESMA URL com
 *    `credentials:'include'` (usa seu login) e recebe os números limpos.
 *  - CASO B (só HTML na tela): o parser genérico lê a tabela-resumo do relatório
 *    mapeando as COLUNAS pelos títulos (AJUSTE os sinônimos em COLUNAS).
 *
 * Retorna { ok, referencia:'YYYY-MM-DD', barbeiros:[{nome, faturamento, comissao,
 *   servicos, produtos, assinaturas, atendimentos}], via:'json'|'html' } ou
 * { ok:false, motivo } quando não achou o relatório / não está logado.
 * ==========================================================================*/
async function extrairAgendaServico() {
  // ── CONFIG (ajuste pro seu Agenda Serviço) ──
  const ENDPOINTS_JSON = [
    // ex.: '/api/relatorio/faturamento?inicio=...&fim=...'
    // Deixe vazio se o Agenda Serviço não tiver endpoint JSON (usa HTML).
  ]
  const COLUNAS = {
    nome:        ['barbeiro', 'profissional', 'colaborador', 'funcionario', 'nome'],
    faturamento: ['faturamento', 'bruto', 'total', 'faturado', 'receita'],
    comissao:    ['comissao', 'comissão'],
    servicos:    ['servico', 'serviço', 'servicos', 'serviços'],
    produtos:    ['produto', 'produtos'],
    assinaturas: ['assinatura', 'assinaturas', 'plano', 'clube'],
    atendimentos:['atendimento', 'atendimentos', 'comanda', 'comandas', 'qtd'],
  }

  const brNum = (s) => {
    if (s == null) return 0
    const m = String(s).replace(/[^\d.,-]/g, '')
    if (!m) return 0
    const norm = m.replace(/\./g, '').replace(',', '.')
    const n = Number(norm)
    return Number.isFinite(n) ? n : 0
  }
  const hojeBR = () => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    return p // en-CA já dá YYYY-MM-DD
  }
  const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const casa = (titulo, sinonimos) => sinonimos.some(s => semAcento(titulo).includes(semAcento(s)))

  // ── CASO A: endpoint JSON interno (reusa a sessão logada) ──
  for (const url of ENDPOINTS_JSON) {
    try {
      const r = await fetch(url, { credentials: 'include', headers: { accept: 'application/json' } })
      if (!r.ok) continue
      const data = await r.json()
      const barbeiros = mapearJson(data)
      if (barbeiros.length) return { ok: true, via: 'json', referencia: hojeBR(), barbeiros }
    } catch { /* tenta o próximo / cai pro HTML */ }
  }

  // ── CASO B: parse da tabela HTML renderizada ──
  const tabelas = Array.from(document.querySelectorAll('table'))
  for (const tabela of tabelas) {
    const headCells = Array.from(tabela.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td'))
      .map(c => c.textContent || '')
    if (headCells.length < 2) continue
    // mapeia índice de cada coluna que reconhecemos
    const idx = {}
    for (const [chave, sinonimos] of Object.entries(COLUNAS)) {
      const i = headCells.findIndex(h => casa(h, sinonimos))
      if (i >= 0) idx[chave] = i
    }
    if (idx.nome == null || (idx.faturamento == null && idx.comissao == null)) continue

    const linhas = Array.from(tabela.querySelectorAll('tbody tr'))
    const barbeiros = []
    for (const tr of linhas) {
      const cels = Array.from(tr.querySelectorAll('td')).map(c => c.textContent || '')
      const nome = (cels[idx.nome] || '').trim()
      if (!nome) continue
      if (/total|geral|soma/i.test(nome)) continue // linha de total
      barbeiros.push({
        nome,
        faturamento: idx.faturamento != null ? brNum(cels[idx.faturamento]) : 0,
        comissao:    idx.comissao    != null ? brNum(cels[idx.comissao])    : 0,
        servicos:    idx.servicos    != null ? brNum(cels[idx.servicos])    : 0,
        produtos:    idx.produtos    != null ? brNum(cels[idx.produtos])    : 0,
        assinaturas: idx.assinaturas != null ? brNum(cels[idx.assinaturas]) : 0,
        atendimentos:idx.atendimentos!= null ? brNum(cels[idx.atendimentos]): 0,
      })
    }
    if (barbeiros.length) return { ok: true, via: 'html', referencia: hojeBR(), barbeiros }
  }

  // Nada encontrado → provavelmente não está na tela do relatório ou não logou.
  return { ok: false, motivo: 'nao_encontrado' }

  // Mapeia um JSON genérico do Agenda Serviço pra nossa estrutura.
  // AJUSTE conforme o formato real do endpoint (README, PARTE 0).
  function mapearJson(data) {
    const arr = Array.isArray(data) ? data
      : Array.isArray(data?.dados) ? data.dados
      : Array.isArray(data?.itens) ? data.itens
      : Array.isArray(data?.result) ? data.result
      : Array.isArray(data?.relatorio) ? data.relatorio
      : []
    return arr.map(it => ({
      nome: it.nome || it.barbeiro || it.profissional || it.colaborador || '',
      faturamento: brNum(it.faturamento ?? it.bruto ?? it.total ?? 0),
      comissao: brNum(it.comissao ?? it.comissão ?? 0),
      servicos: brNum(it.servicos ?? it.serviços ?? 0),
      produtos: brNum(it.produtos ?? 0),
      assinaturas: brNum(it.assinaturas ?? it.planos ?? 0),
      atendimentos: brNum(it.atendimentos ?? it.comandas ?? it.qtd ?? 0),
    })).filter(b => b.nome)
  }
}
