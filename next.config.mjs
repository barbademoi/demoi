/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // O leitor do Agenda usa PDF.js somente no servidor. Mantê-lo externo
    // garante que os arquivos auxiliares do pacote sejam enviados junto da
    // função da Vercel, em vez de virarem um chunk dinâmico não rastreado.
    serverComponentsExternalPackages: ['pdfjs-dist'],
    outputFileTracingIncludes: {
      '/api/importacao-agenda/leitura': [
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      ],
      '/api/importacao-agenda/previsualizar': [
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      ],
      '/api/importacao-agenda/confirmar': [
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Cache-Control headers para evitar que navegadores agressivos (Safari iOS)
  // sirvam HTML antigo após um deploy. Rotas dinâmicas/autenticadas não devem
  // ser cacheadas. Assets estáticos em _next/static continuam com o cache
  // padrão imutável do Next.js (não são afetados).
  async headers() {
    const NO_CACHE = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, max-age=0',
      },
    ]

    return [
      { source: '/',                            headers: NO_CACHE },
      { source: '/dashboard/:path*',            headers: NO_CACHE },
      { source: '/configuracoes/:path*',        headers: NO_CACHE },
      { source: '/cards/:path*',                headers: NO_CACHE },
      { source: '/treinamentos/:path*',         headers: NO_CACHE },
      { source: '/admin/:path*',                headers: NO_CACHE },
      { source: '/b/:path*',                    headers: NO_CACHE },
      { source: '/onboarding/:path*',           headers: NO_CACHE },
      { source: '/boas-vindas',                 headers: NO_CACHE },
      { source: '/comprar',                     headers: NO_CACHE },
      { source: '/aguardando',                  headers: NO_CACHE },
      { source: '/login',                       headers: NO_CACHE },
      { source: '/esqueci-senha',               headers: NO_CACHE },
      { source: '/redefinir-senha',             headers: NO_CACHE },
      { source: '/redefinir-senha-obrigatoria', headers: NO_CACHE },
    ]
  },
}

export default nextConfig
