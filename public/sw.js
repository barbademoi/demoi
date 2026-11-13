/* BarberMeta — service worker.
 *
 * Existe por UM motivo: no navegador, notificação push só chega por aqui. O
 * push service entrega pro service worker, e é ele que desenha o aviso — a
 * página nem precisa estar aberta, e normalmente não está.
 *
 * NÃO faz cache de nada, de propósito. O BarberMeta é dado vivo: meta, ranking
 * e comissão mudam durante o dia, e um cache servindo a tela de ontem seria
 * pior que a página demorar meio segundo a mais pra carregar.
 */

self.addEventListener('install', () => {
  // Assume o controle sem esperar as abas antigas fecharem. Sem isto, a
  // primeira inscrição só começaria a funcionar no próximo acesso.
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim())
})

self.addEventListener('push', (evento) => {
  let dado = {}
  try {
    dado = evento.data ? evento.data.json() : {}
  } catch (e) {
    dado = {}
  }

  const titulo = dado.titulo || 'BarberMeta'
  const opcoes = {
    body: dado.corpo || '',
    icon: '/icone-192.png',
    badge: '/icone-badge.png',
    // A tag agrupa: um aviso novo do mesmo assunto SUBSTITUI o anterior em vez
    // de empilhar. Sem isso, quem passou o dia fora encontraria seis lembretes
    // iguais do lançamento diário na tela de bloqueio.
    tag: dado.tag || 'barbermeta',
    renotify: true,
    data: { url: dado.url || '/dashboard' },
    // Sem vibração longa nem requireInteraction: o aviso some sozinho e não
    // obriga ninguém a tocar nele pra voltar ao que estava fazendo.
  }

  evento.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = (evento.notification.data && evento.notification.data.url) || '/dashboard'

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abas) => {
      // Já tem uma aba do BarberMeta aberta? Usa ela e navega — abrir uma
      // segunda janela do mesmo sistema confunde mais do que ajuda.
      for (const aba of abas) {
        if (aba.url.includes(self.location.origin) && 'focus' in aba) {
          aba.focus()
          if ('navigate' in aba) return aba.navigate(destino)
          return
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
