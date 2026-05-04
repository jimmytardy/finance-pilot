import type { MetadataRoute } from 'next'
import { getCanonicalEnv } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  try {
    const raw = getCanonicalEnv().NEXTAUTH_URL?.trim()
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
  } catch {
    return { rules: { userAgent: '*', allow: '/' } }
  }
}
