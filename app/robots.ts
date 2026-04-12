import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  let origin: string | undefined
  if (raw) {
    try {
      origin = new URL(raw.endsWith('/') ? raw : `${raw}/`).origin
    } catch {
      origin = undefined
    }
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  }
}
