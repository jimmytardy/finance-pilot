import type { MetadataRoute } from 'next'
import { metadataBaseFromEnv } from '@/lib/seo-metadata'

const PATHS: {
  path: string
  priority: number
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
}[] = [
  { path: '/donnees', priority: 1, changeFrequency: 'weekly' },
  { path: '/gestion-mensuel', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/estimations', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/comparaison', priority: 0.8, changeFrequency: 'weekly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = metadataBaseFromEnv()
  if (!base) return []
  const lastModified = new Date()
  return PATHS.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, base).toString(),
    lastModified,
    changeFrequency,
    priority,
  }))
}
