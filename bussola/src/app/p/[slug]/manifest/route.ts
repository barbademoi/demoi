// Manifest dinâmico por profissional: o PWA abre direto no link dele.
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const manifest = {
    name: 'Bússola',
    short_name: 'Bússola',
    description: 'Seu placar e seus elogios.',
    start_url: `/p/${params.slug}`,
    scope: `/p/${params.slug}`,
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#1F3A52',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
