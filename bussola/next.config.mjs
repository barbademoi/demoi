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
