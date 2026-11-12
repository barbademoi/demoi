/** Manifesto PWA do Tarefix (o colaborador "instala" o próprio link na tela do celular). */
export function manifesto({ nome, nomeCurto, inicio }: { nome: string; nomeCurto: string; inicio: string }) {
  return {
    name: nome,
    short_name: nomeCurto,
    description: 'Checklist diário de tarefas da equipe.',
    lang: 'pt-BR',
    start_url: inicio,
    scope: inicio,
    id: inicio,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F3F8',
    theme_color: '#5B3DF5',
    icons: [
      { src: '/tarefix/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/tarefix/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/tarefix/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

export function respostaManifesto(dados: ReturnType<typeof manifesto>) {
  return new Response(JSON.stringify(dados), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
