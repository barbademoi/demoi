/* Tarefix — service worker das notificações push.
 * Escopo: /tarefix/ (painel do dono e links dos colaboradores).
 * Só mostra notificações e abre o link ao tocar; não faz cache de nada. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let dados = {}
  try {
    dados = e.data ? e.data.json() : {}
  } catch (_) {
    dados = { titulo: 'Tarefix', corpo: e.data ? e.data.text() : '' }
  }
  const titulo = dados.titulo || 'Tarefix'
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || '',
      icon: '/tarefix/icone-192.png',
      badge: '/tarefix/icone-192.png',
      tag: dados.tag || undefined,
      renotify: Boolean(dados.tag),
      data: { url: dados.url || '/tarefix' },
      lang: 'pt-BR',
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL((e.notification.data && e.notification.data.url) || '/tarefix', self.location.origin).href
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (j.url.split('?')[0] === url.split('?')[0] && 'focus' in j) return j.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
