import type { MetadataRoute } from 'next'
import { metadataBaseFromEnv } from '@/lib/seo-metadata'

const PATHS: {
  path: string
  priority: number
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
}[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/simulateur', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/simulateur/donnees', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/simulateur/gestion-mensuel', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/simulateur/estimations', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/simulateur/comparaison', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/strategies-patrimoine', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/guides/finances-en-4-etapes', priority: 0.88, changeFrequency: 'monthly' },
  { path: '/guides/7-strategies-gestion-argent', priority: 0.88, changeFrequency: 'monthly' },
  { path: '/guides/budget-tresorerie', priority: 0.88, changeFrequency: 'monthly' },
  { path: '/guides/quelle-strategie-pour-mon-profil', priority: 0.86, changeFrequency: 'monthly' },
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
