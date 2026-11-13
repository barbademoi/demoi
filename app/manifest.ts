import type { MetadataRoute } from 'next'

/**
 * MANIFESTO DO PWA.
 *
 * Existe por causa do iPhone. No Android e no computador, notificação push
 * funciona com o site aberto no navegador normal. No iOS, a Apple só libera
 * push pra site ADICIONADO À TELA DE INÍCIO — e, pra poder ser adicionado
 * como app, o site precisa de um manifesto com `display: standalone` e
 * ícones. Sem este arquivo, metade dos barbeiros simplesmente não receberia
 * nada, e não haveria o que depurar: a opção nem aparece no menu do Safari.
 *
 * `display: standalone` também é o que tira a barra de endereço quando o
 * dono abre pela tela de início — vira app, não aba.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BarberMeta',
    short_name: 'BarberMeta',
    description: 'Metas, ranking e comissão da sua barbearia, dia a dia.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0C',
    theme_color: '#0A0A0C',
    orientation: 'portrait',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // `maskable` deixa o Android recortar no formato do sistema (círculo,
      // quadrado arredondado) sem comer o desenho: a logo ocupa 78% da arte,
      // então sobra margem pra qualquer recorte.
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
