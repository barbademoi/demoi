import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bússola',
    short_name: 'Bússola',
    description: 'Mentor de reuniões semanais com IA',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F1EA',
    theme_color: '#8B6F47',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
