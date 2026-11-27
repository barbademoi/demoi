/** @type {import('next').NextConfig} */
const NO_CACHE = [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }]

const nextConfig = {
  async headers() {
    return [
      { source: '/app/:path*', headers: NO_CACHE },
      { source: '/admin/:path*', headers: NO_CACHE },
      { source: '/comprar/:path*', headers: NO_CACHE },
      { source: '/aguardando', headers: NO_CACHE },
      { source: '/renovar', headers: NO_CACHE },
    ]
  },
}

export default nextConfig
