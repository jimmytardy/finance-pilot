import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return []
  let origin: string
  try {
    origin = new URL(raw.endsWith('/') ? raw : `${raw}/`).origin
  } catch {
    return []
  }
  const paths = ['/', '/donnees', '/gestion-finances', '/estimations', '/comparaison'] as const
  const now = new Date()
  return paths.map((path) => ({
    url: path === '/' ? `${origin}/` : `${origin}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.85,
  }))
}
