/* ============================================================================
 * POPUP — orquestra o fluxo do botão "Atualizar infos":
 *  1. lê a config (URL do BarberMeta + token) do chrome.storage.local
 *  2. injeta o extrator na aba ativa (Agenda Serviço) → reaproveita a sessão
 *  3. manda os dados extraídos pro /api/import-agenda do BarberMeta (Bearer)
 *  4. mostra confirmação ("X barbeiros atualizados") ou erro claro
 *
 * NUNCA pede/guarda senha: o extrator roda dentro da aba já logada e usa os
 * cookies dela; aqui só trafegam os NÚMEROS do relatório + o token da API.
 * ==========================================================================*/

const $ = (id) => document.getElementById(id)
const statusEl = $('status')
const botao = $('go')
const cfgStatusEl = $('cfgStatus')

function mostrar(texto, classe) {
  statusEl.textContent = texto
  statusEl.className = classe || 'muted'
}

// Recado da área de configuração — fica colado no botão Salvar. O #status
// principal está acima e some da vista quando o bloco "Configurar" está
// aberto: a confirmação aparecia num canto que ninguém estava olhando.
function mostrarCfg(texto, classe) {
  if (!cfgStatusEl) { mostrar(texto, classe); return }
  cfgStatusEl.textContent = texto
  cfgStatusEl.className = 'cfgmsg ' + (classe || 'muted')
}

// ── Config (URL + token) persistida localmente ──
async function lerConfig() {
  const { cfgUrl, cfgToken } = await chrome.storage.local.get(['cfgUrl', 'cfgToken'])
  return {
    url: (cfgUrl || 'https://barbermeta.com.br').replace(/\/+$/, ''),
    token: cfgToken || '',
  }
}

async function carregarCampos() {
  const { url, token } = await lerConfig()
  $('cfgUrl').value = url
  $('cfgToken').value = token
}

/* ────────────────────────────────────────────────────────────────────────────
 * DOIS CAMINHOS PRA FALAR COM O BARBERMETA
 *
 * O popup é uma página `chrome-extension://`. Pra ele, barbermeta.com.br é um
 * site de terceiros — e isso quebra de duas formas que dão a MESMA mensagem
 * seca ("Failed to fetch"):
 *   1. se o domínio redireciona (apex → www, por exemplo), o Chrome só segue o
 *      salto se o destino também estiver no host_permissions;
 *   2. cookie de sessão é de primeira parte; dependendo da política do
 *      navegador ele não acompanha um POST vindo de outra origem.
 *
 * Por isso existe o caminho 2: mandar de DENTRO de uma aba do BarberMeta. Ali a
 * chamada é `/api/import-agenda` na própria origem — mesmo domínio, cookie
 * garantido, redirecionamento irrelevante. É o caminho que não depende de nada
 * que a gente não controle.
 * ──────────────────────────────────────────────────────────────────────────*/

// Caminho 1: direto do popup.
async function enviarDoPopup(url, token, corpo) {
  const cabecalhos = { 'content-type': 'application/json' }
  if (token) cabecalhos.authorization = `Bearer ${token}`
  try {
    const resp = await fetch(`${url}/api/import-agenda`, {
      method: 'POST',
      credentials: 'include',
      headers: cabecalhos,
      body: JSON.stringify(corpo),
    })
    const dados = await resp.json().catch(() => ({}))
    return { via: 'popup', ok: resp.ok, status: resp.status, dados }
  } catch (e) {
    return { via: 'popup', erroRede: String(e?.message || e) }
  }
}

// Acha uma aba do BarberMeta; se não houver, abre uma em segundo plano. Abrir
// sozinho em vez de mandar a pessoa abrir: quem já não conseguiu configurar a
// extensão não deveria ter que descobrir isso sozinho.
async function abaDoBarberMeta(url) {
  const host = new URL(url).host
  let abas = []
  try { abas = await chrome.tabs.query({ url: `*://${host}/*` }) } catch { abas = [] }
  const pronta = abas.find((a) => a.id != null)
  if (pronta) return { id: pronta.id, criada: false }

  const nova = await chrome.tabs.create({ url: `${url}/dashboard`, active: false })
  // Injetar numa aba que ainda está carregando dá erro. 15s é folga suficiente
  // pra um carregamento normal e curto o bastante pra não travar o popup.
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 250))
    const t = await chrome.tabs.get(nova.id).catch(() => null)
    if (!t) break
    if (t.status === 'complete') break
  }
  return { id: nova.id, criada: true }
}

// Caminho 2: de dentro da aba do BarberMeta (mesma origem).
async function enviarPelaAba(url, token, corpo) {
  let aba
  try {
    aba = await abaDoBarberMeta(url)
  } catch (e) {
    return { via: 'aba', erroRede: 'não consegui abrir o BarberMeta: ' + String(e?.message || e) }
  }

  try {
    const [inj] = await chrome.scripting.executeScript({
      target: { tabId: aba.id },
      args: [corpo, token],
      func: async (corpo, token) => {
        const cab = { 'content-type': 'application/json' }
        if (token) cab.authorization = 'Bearer ' + token
        try {
          const r = await fetch('/api/import-agenda', {
            method: 'POST',
            credentials: 'same-origin',
            headers: cab,
            body: JSON.stringify(corpo),
          })
          const txt = await r.text()
          let d = {}
          try { d = JSON.parse(txt) } catch { /* resposta não-JSON: fica o status */ }
          return { ok: r.ok, status: r.status, dados: d }
        } catch (e) {
          return { erroRede: String((e && e.message) || e) }
        }
      },
    })
    const r = inj?.result
    if (!r) return { via: 'aba', erroRede: 'a aba do BarberMeta não respondeu' }
    // A aba aberta por nós era um meio, não um resultado — não deixa lixo.
    if (aba.criada) chrome.tabs.remove(aba.id).catch(() => {})
    return { via: 'aba', ...r }
  } catch (e) {
    if (aba.criada) chrome.tabs.remove(aba.id).catch(() => {})
    return { via: 'aba', erroRede: String(e?.message || e) }
  }
}

// Deixa ver o que foi colado. Campo de senha escondendo um token que a pessoa
// acabou de colar não protege nada — ninguém decora esse valor — e impede de
// conferir se veio inteiro ou com espaço sobrando.
$('verToken').addEventListener('click', () => {
  const campo = $('cfgToken')
  const escondido = campo.type === 'password'
  campo.type = escondido ? 'text' : 'password'
  $('verToken').textContent = escondido ? 'Esconder o token' : 'Mostrar o token'
})

// Roda o diagnóstico NA ABA do Agenda Serviço e põe o resultado na área de
// transferência. Sem isso, "não achei o relatório" é um beco sem saída: nem
// quem usa nem quem escreve o código sabe o que a página tem.
$('diag').addEventListener('click', async () => {
  mostrarCfg('Lendo a estrutura da página…', 'muted')
  try {
    const [aba] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!aba?.id) { mostrarCfg('Não achei a aba ativa.', 'err'); return }

    const [inj] = await chrome.scripting.executeScript({
      target: { tabId: aba.id },
      func: diagnosticarAgendaServico,
    })
    const texto = inj?.result
    if (!texto) { mostrarCfg('Não consegui ler a página. Ela está aberta e logada?', 'err'); return }

    try {
      await navigator.clipboard.writeText(texto)
      mostrarCfg(`✓ Diagnóstico copiado (${texto.length} caracteres).\nCole no chat do suporte.`, 'ok')
    } catch {
      // A área de transferência pode ser negada. Mostrar o texto é melhor do
      // que dizer "não consegui" e deixar a pessoa sem o dado na mão.
      const caixa = $('diagTexto')
      caixa.value = texto
      caixa.hidden = false
      caixa.select()
      mostrarCfg('Não consegui copiar sozinho. O texto está aí embaixo — selecione tudo e copie.', 'muted')
    }
  } catch (e) {
    mostrarCfg('Não consegui ler a página: ' + (e?.message || e), 'err')
  }
})

// Sonda os dois caminhos e diz onde para. "Falha ao falar com o BarberMeta"
// misturava três problemas diferentes — URL inalcançável, sessão ausente e
// conta inexistente — e cada um pede uma ação distinta.
$('testar').addEventListener('click', async () => {
  mostrarCfg('Testando…', 'muted')
  const url = $('cfgUrl').value.trim().replace(/\/+$/, '') || 'https://barbermeta.com.br'
  const linhas = []

  // Direto do popup.
  try {
    const r = await fetch(`${url}/api/import-agenda`, { credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    linhas.push(`Direto: alcançou (HTTP ${r.status})` + (d.logado ? ` · logado como ${d.email}` : ' · SEM sessão'))
  } catch (e) {
    linhas.push('Direto: não alcançou (' + (e?.message || e) + ')')
  }

  // Por dentro de uma aba do BarberMeta.
  try {
    const aba = await abaDoBarberMeta(url)
    const [inj] = await chrome.scripting.executeScript({
      target: { tabId: aba.id },
      func: async () => {
        try {
          const r = await fetch('/api/import-agenda', { credentials: 'same-origin' })
          const d = await r.json().catch(() => ({}))
          return { status: r.status, logado: !!d.logado, email: d.email || null }
        } catch (e) { return { erro: String((e && e.message) || e) } }
      },
    })
    if (aba.criada) chrome.tabs.remove(aba.id).catch(() => {})
    const r = inj?.result
    if (!r) linhas.push('Pela aba: a aba não respondeu')
    else if (r.erro) linhas.push('Pela aba: ' + r.erro)
    else linhas.push(`Pela aba: alcançou (HTTP ${r.status})` + (r.logado ? ` · logado como ${r.email}` : ' · SEM sessão'))
  } catch (e) {
    linhas.push('Pela aba: ' + (e?.message || e))
  }

  const algumLogado = linhas.some((l) => l.includes('logado como'))
  linhas.push(algumLogado
    ? 'Pronto pra importar.'
    : 'Falta entrar no BarberMeta neste navegador (ou preencher o token).')
  mostrarCfg(linhas.join('\n'), algumLogado ? 'ok' : 'err')
})

$('salvar').addEventListener('click', async () => {
  const url = $('cfgUrl').value.trim().replace(/\/+$/, '')
  const token = $('cfgToken').value.trim()

  // O token virou opcional, então salvar SÓ a URL passou a ser legítimo — antes
  // isso era recusado, e quem usava a sessão não conseguia corrigir a URL.
  if (!url) {
    mostrarCfg('Preencha a URL do BarberMeta.', 'err')
    return
  }

  try {
    await chrome.storage.local.set({ cfgUrl: url, cfgToken: token })

    // LÊ DE VOLTA pra confirmar. Sem isso, "Config salva." é só uma promessa:
    // se o storage recusar a escrita, a mensagem verde aparece do mesmo jeito
    // e a pessoa fica horas procurando erro no token.
    const { cfgToken: gravado } = await chrome.storage.local.get(['cfgToken'])
    if (gravado !== token) {
      mostrarCfg('O navegador não guardou o token. Feche e abra o popup e tente de novo.', 'err')
      return
    }

    // Mostra o começo e o fim do que ficou guardado: dá pra conferir contra o
    // que está na Vercel sem expor o valor inteiro na tela.
    const marca = !token
      ? 'sem token — vai pela sua sessão do BarberMeta'
      : token.length > 10
        ? `${token.slice(0, 4)}…${token.slice(-4)} (${token.length} caracteres)`
        : `${token.length} caracteres`
    mostrarCfg(`✓ Salvo. Token: ${marca}\nURL: ${url}`, 'ok')
  } catch (e) {
    mostrarCfg('Não consegui salvar: ' + (e?.message || e), 'err')
  }
})

// ── Fluxo principal ──
botao.addEventListener('click', async () => {
  botao.disabled = true
  mostrar('Lendo o relatório do Agenda Serviço…', 'muted')

  try {
    const { url, token } = await lerConfig()
    // O token virou OPCIONAL: sem ele, a chamada vai com o cookie do
    // BarberMeta e o servidor identifica o dono pela sessão logada. Exigir
    // token aqui obrigava a passar pela Vercel antes de a extensão servir
    // pra alguma coisa — e era onde todo mundo empacava.

    // Aba ativa = a que você está vendo (o Agenda Serviço aberto no relatório).
    const [aba] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!aba?.id) { mostrar('Não achei a aba ativa.', 'err'); return }
    if (/^(chrome|edge|about|chrome-extension):/i.test(aba.url || '')) {
      mostrar('Abra a aba do Agenda Serviço (na tela do relatório) e tente de novo.', 'err')
      return
    }

    // Injeta o extrator NA aba do Agenda Serviço (usa a sessão já logada).
    let resultado
    try {
      const [inj] = await chrome.scripting.executeScript({
        target: { tabId: aba.id },
        func: extrairAgendaServico,
      })
      resultado = inj?.result
    } catch (e) {
      mostrar('Não consegui ler a página. Ela precisa estar aberta e logada.\n(' + (e?.message || e) + ')', 'err')
      return
    }

    if (!resultado || !resultado.ok) {
      mostrar(
        'Não achei o relatório nesta aba.\n\n'
        + 'Se a tela do relatório JÁ está aberta e logada, então ela é montada de um jeito '
        + 'que o leitor ainda não conhece. Abra "Configurar (uma vez)" aqui embaixo e clique '
        + 'em "Copiar diagnóstico da tela" — é isso que permite corrigir o leitor.',
        'err',
      )
      return
    }

    const barbeiros = resultado.barbeiros || []
    if (barbeiros.length === 0) {
      mostrar('Relatório lido, mas sem barbeiros reconhecidos. Confira se está na tela certa.', 'err')
      return
    }

    mostrar(`Enviando ${barbeiros.length} barbeiro(s) pro BarberMeta…`, 'muted')

    // Manda pro BarberMeta. Tenta o caminho direto e, se ele falhar por algo
    // que a aba resolve (rede bloqueada ou cookie que não viajou), refaz por
    // dentro do BarberMeta em vez de devolver um erro pra pessoa resolver.
    const corpo = { referencia: resultado.referencia, barbeiros, casa: resultado.casa || null }

    let envio = await enviarDoPopup(url, token, corpo)
    const cookieNaoViajou = envio.status === 401 && !token
    if (envio.erroRede || cookieNaoViajou) {
      mostrar('Refazendo por dentro do BarberMeta…', 'muted')
      const pelaAba = await enviarPelaAba(url, token, corpo)
      // Só troca se a segunda tentativa realmente chegou a algum lugar: um erro
      // de rede substituindo o outro não ajudaria ninguém.
      if (!pelaAba.erroRede) envio = pelaAba
      else if (envio.erroRede) envio = pelaAba
    }

    if (envio.erroRede) {
      mostrar(
        'Falha ao falar com o BarberMeta.\n\n'
        + `Tentei ${url}/api/import-agenda e também de dentro de uma aba do BarberMeta.\n`
        + '(' + envio.erroRede + ')\n\n'
        + 'Abra "Configurar (uma vez)" e clique em "Testar conexão" — ele diz em qual '
        + 'das etapas está parando.',
        'err',
      )
      return
    }

    const dados = envio.dados || {}
    const resp = { ok: envio.ok, status: envio.status }

    if (!resp.ok) {
      // Um 500 sem texto quase sempre é variável de ambiente faltando no
      // servidor — dizer isso poupa o dono de procurar erro no cadastro dele.
      const detalhe = dados?.error
        || (resp.status >= 500
          ? `erro ${resp.status} no servidor (nenhuma mensagem). Isso costuma ser configuração do BarberMeta, não do seu cadastro — avise o suporte.`
          : `erro ${resp.status}`)
      mostrar('BarberMeta recusou: ' + detalhe, 'err')
      return
    }

    // Resumo — o servidor manda as frases já prontas, com a AÇÃO de cada caso
    // (renomear, reativar, cadastrar). Manter esse texto em um lugar só evita
    // que a extensão e o painel expliquem a mesma coisa de jeitos diferentes.
    const linhas = []
    if (Array.isArray(dados.mensagens) && dados.mensagens.length) {
      linhas.push(...dados.mensagens)
    } else {
      // Versão antiga do servidor: mantém o formato anterior.
      linhas.push(`✓ Enviado — ${dados.atualizados} barbeiro(s) atualizados`)
      if (Array.isArray(dados.naoEncontrados) && dados.naoEncontrados.length) {
        linhas.push(`○ Sem correspondência: ${dados.naoEncontrados.join(', ')}`)
      }
    }
    if (dados.ciclo) {
      linhas.push(
        `Ciclo ${dados.ciclo} · fonte: ${resultado.via === 'json' ? 'endpoint interno' : 'tela (HTML)'}`
        + ` · envio: ${envio.via === 'aba' ? 'pela aba do BarberMeta' : 'direto'}`,
      )
    }

    // Importar ninguém não é sucesso, mesmo o servidor tendo respondido 200.
    const nenhum = dados.resumo ? dados.resumo.importados.length === 0 : dados.atualizados === 0
    mostrar(linhas.join('\n\n'), nenhum ? 'err' : 'ok')
  } finally {
    botao.disabled = false
  }
})

// Um erro aqui deixaria a extensão inteira muda — sem listener, todo botão
// vira enfeite e nada explica por quê. Melhor dizer na tela.
try {
  carregarCampos()
} catch (e) {
  mostrar('A extensão não carregou direito: ' + (e?.message || e), 'err')
}
