import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/urlBase'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: APP_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/entrar`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
