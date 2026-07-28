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

function mostrar(texto, classe) {
  statusEl.textContent = texto
  statusEl.className = classe || 'muted'
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

$('salvar').addEventListener('click', async () => {
  const url = $('cfgUrl').value.trim().replace(/\/+$/, '')
  const token = $('cfgToken').value.trim()
  await chrome.storage.local.set({ cfgUrl: url, cfgToken: token })
  mostrar('Config salva.', 'ok')
})

// ── Fluxo principal ──
botao.addEventListener('click', async () => {
  botao.disabled = true
  mostrar('Lendo o relatório do Agenda Serviço…', 'muted')

  try {
    const { url, token } = await lerConfig()
    if (!token) {
      mostrar('Configure o token de importação em "Configurar (uma vez)".', 'err')
      return
    }

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
      mostrar('Não achei o relatório nesta aba.\nAbra e faça login no Agenda Serviço, vá até a tela do relatório de faturamento e tente de novo.', 'err')
      return
    }

    const barbeiros = resultado.barbeiros || []
    if (barbeiros.length === 0) {
      mostrar('Relatório lido, mas sem barbeiros reconhecidos. Confira se está na tela certa.', 'err')
      return
    }

    mostrar(`Enviando ${barbeiros.length} barbeiro(s) pro BarberMeta…`, 'muted')

    // Manda pro BarberMeta (token protege o endpoint; nada de senha aqui).
    let resp, dados
    try {
      resp = await fetch(`${url}/api/import-agenda`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ referencia: resultado.referencia, barbeiros }),
      })
      dados = await resp.json().catch(() => ({}))
    } catch (e) {
      mostrar('Falha ao falar com o BarberMeta. Confira a URL e sua internet.\n(' + (e?.message || e) + ')', 'err')
      return
    }

    if (!resp.ok) {
      mostrar('BarberMeta recusou: ' + (dados?.error || `erro ${resp.status}`), 'err')
      return
    }

    // Sucesso — monta o resumo.
    let msg = `✓ Enviado — ${dados.atualizados} barbeiro(s) atualizados`
    if (dados.ciclo) msg += `\nCiclo ${dados.ciclo} · fonte: ${resultado.via === 'json' ? 'endpoint interno' : 'tela (HTML)'}`
    if (Array.isArray(dados.naoEncontrados) && dados.naoEncontrados.length) {
      msg += `\n⚠ Sem correspondência (confira o nome no BarberMeta): ${dados.naoEncontrados.join(', ')}`
    }
    mostrar(msg, 'ok')
  } finally {
    botao.disabled = false
  }
})

carregarCampos()
