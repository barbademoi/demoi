const CACHE = 'bussola-static-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    ).then(() => self.clients.claim())
  )
})

// Cache-first APENAS para assets estáticos. Páginas e dados sempre via rede,
// pra nunca servir placar/elogios desatualizados.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const ehEstatico = url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.svg'
  if (!ehEstatico) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request)
      if (hit) return hit
      const resp = await fetch(request)
      if (resp && resp.status === 200) cache.put(request, resp.clone())
      return resp
    })
  )
})
