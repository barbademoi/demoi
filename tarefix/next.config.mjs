/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] },
  webpack(config) {
    // Permite importar os .sql como texto (a tela /instalar mostra o SQL com botão "Copiar").
    config.module.rules.push({ test: /\.sql$/, type: 'asset/source' })
    return config
  },
}
export default nextConfig
