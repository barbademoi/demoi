/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Em produção (Vercel), força tráfego que chega pelo subdomínio
  // *.vercel.app pro domínio canônico bussolameet.com.br. Em deploys
  // preview (VERCEL_ENV === 'preview') NÃO redireciona — assim os
  // PR previews continuam acessíveis pela URL .vercel.app deles.
  async redirects() {
    if (process.env.VERCEL_ENV !== 'production') return []
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<sub>.*)\\.vercel\\.app',
          },
        ],
        destination: 'https://bussolameet.com.br/:path*',
        permanent: true,
      },
    ]
  },
  // Rotas autenticadas não devem ser cacheadas pelo navegador.
  async headers() {
    const NO_CACHE = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, max-age=0',
      },
    ]

    return [
      { source: '/painel/:path*', headers: NO_CACHE },
      { source: '/onboarding/:path*', headers: NO_CACHE },
      { source: '/entrar', headers: NO_CACHE },
      { source: '/cadastro', headers: NO_CACHE },
      { source: '/esqueci-senha', headers: NO_CACHE },
      { source: '/redefinir-senha', headers: NO_CACHE },
    ]
  },
}

export default nextConfig
