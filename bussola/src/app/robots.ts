import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/urlBase'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/painel/', '/api/', '/onboarding/', '/p/', '/c/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
