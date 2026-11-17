/* Tarefix — service worker das notificações push.
 * Escopo: /tarefix/ (painel do dono e links dos colaboradores).
 * Mostra notificações, abre o link ao tocar e trata os botões
 * "Feito" / "Adiar 15 min". Não faz cache de nada. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

const ROTULOS = { feito: '✓ Feito', adiar: '⏰ Adiar 15 min' }

self.addEventListener('push', (e) => {
  let dados = {}
  try {
    dados = e.data ? e.data.json() : {}
  } catch (_) {
    dados = { titulo: 'Tarefix', corpo: e.data ? e.data.text() : '' }
  }
  const titulo = dados.titulo || 'Tarefix'
  const botoes = Array.isArray(dados.botoes) && dados.passe ? dados.botoes.filter((b) => ROTULOS[b]) : []
  const opcoes = {
    body: dados.corpo || '',
    icon: '/tarefix/icone-192.png',
    badge: '/tarefix/icone-192.png',
    tag: dados.tag || undefined,
    renotify: Boolean(dados.tag),
    data: { url: dados.url || '/tarefix', passe: dados.passe || null },
    lang: 'pt-BR',
  }
  // Aviso de tarefa: "com cara de alarme" — fica na tela até mexer e vibra forte
  if (dados.forte) {
    opcoes.requireInteraction = true
    opcoes.vibrate = [400, 150, 400, 150, 800]
  }
  if (botoes.length) opcoes.actions = botoes.map((b) => ({ action: b, title: ROTULOS[b] }))
  e.waitUntil(self.registration.showNotification(titulo, opcoes))
})

function abrir(url) {
  const alvo = new URL(url || '/tarefix', self.location.origin).href
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
    for (const j of janelas) {
      if (j.url.split('?')[0] === alvo.split('?')[0] && 'focus' in j) return j.focus()
    }
    return self.clients.openWindow(alvo)
  })
}

self.addEventListener('notificationclick', (e) => {
  const dados = e.notification.data || {}
  e.notification.close()
  const acao = e.action
  if ((acao === 'feito' || acao === 'adiar') && dados.passe) {
    e.waitUntil(
      fetch('/tarefix/api/push/acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passe: dados.passe, acao }),
      })
        .then((r) => r.json())
        .then((r) => {
          if (!r || !r.ok) return abrir(dados.url) // não deu pela notificação: abre o app
          return self.registration.showNotification(r.mensagem || 'Pronto', {
            icon: '/tarefix/icone-192.png',
            badge: '/tarefix/icone-192.png',
            tag: 'tarefix-confirmacao',
            silent: true,
            data: { url: dados.url },
            lang: 'pt-BR',
          })
        })
        .catch(() => abrir(dados.url))
    )
    return
  }
  e.waitUntil(abrir(dados.url))
})
